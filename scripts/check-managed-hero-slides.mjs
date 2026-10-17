import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import WebSocket from "ws";

const baseUrl = process.env.HERO_SLIDES_TEST_URL || "http://127.0.0.1:5000/";
const chromiumPath = process.env.CHROMIUM_PATH || "/repl/tools/bin/chromium";
const managedTitle = "Managed Organic Turmeric for Global Formulations";
const fixtureSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#9c6b26"/><stop offset="1" stop-color="#31513a"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><circle cx="820" cy="330" r="190" fill="#e7c65a"/><text x="70" y="700" fill="white" font-size="64" font-family="sans-serif">Fixture image</text></svg>`;
const fixtureSlides = [
  {
    id: 940001,
    title: managedTitle,
    subtitle: "Bulk turmeric for demanding formulations",
    description:
      "Traceable organic turmeric with dependable specifications, careful processing and export-ready documentation for food, wellness and personal-care manufacturers.",
    backgroundImage: `data:image/svg+xml,${encodeURIComponent(fixtureSvg)}`,
    imagePositionX: 73,
    imagePositionY: 28,
    textColor: "white",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 940002,
    title: "Inactive fixture must stay hidden",
    subtitle: "This slide must not render",
    description: "An inactive fixture included to confirm the public carousel filters it out.",
    backgroundImage: `data:image/svg+xml,${encodeURIComponent(fixtureSvg)}`,
    textColor: "white",
    displayOrder: 2,
    isActive: false,
  },
];

const temporaryProfile = await mkdtemp(path.join(os.tmpdir(), "managed-hero-slides-"));
const chromium = spawn(chromiumPath, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--remote-debugging-port=0",
  "--remote-allow-origins=*",
  `--user-data-dir=${temporaryProfile}`,
], { stdio: ["ignore", "ignore", "pipe"] });

let chromiumErrorOutput = "";
chromium.stderr.setEncoding("utf8");
chromium.stderr.on("data", (chunk) => {
  chromiumErrorOutput = `${chromiumErrorOutput}${chunk}`.slice(-4000);
});

let socket;
const pending = new Map();
let nextCommandId = 0;

function send(method, params = {}) {
  const id = ++nextCommandId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (response.result?.type === "object" && response.result.subtype === "error") {
    throw new Error(response.result.description || "Browser expression failed");
  }
  return response.result?.value;
}

async function waitFor(check, description, timeoutMs = 15000) {
  const expiresAt = Date.now() + timeoutMs;
  while (Date.now() < expiresAt) {
    const result = await check();
    if (result) return result;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${description}`);
}

async function setViewport(width, height, mobile) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
}

async function activeSlideTitle() {
  return evaluate(
    `document.querySelector('section[aria-roledescription="carousel"] h1')?.textContent?.trim() || ""`,
  );
}

async function pressKey(key) {
  const windowsVirtualKeyCode = key === "Enter" ? 13 : key === "Tab" ? 9 : 32;
  await send("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key,
    code: key === " " ? "Space" : key,
    windowsVirtualKeyCode,
  });
  if (key === "Enter" || key === " ") {
    await send("Input.dispatchKeyEvent", {
      type: "char",
      key,
      text: key === "Enter" ? "\r" : " ",
      unmodifiedText: key === "Enter" ? "\r" : " ",
      windowsVirtualKeyCode,
    });
  }
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code: key === " " ? "Space" : key,
    windowsVirtualKeyCode,
  });
}

try {
  await waitFor(async () => {
    try {
      const activePort = (await readFile(path.join(temporaryProfile, "DevToolsActivePort"), "utf8"))
        .split("\n")[0];
      return Number(activePort) > 0 ? Number(activePort) : null;
    } catch {
      return null;
    }
  }, "Chromium remote debugging to start");

  const activePort = Number(
    (await readFile(path.join(temporaryProfile, "DevToolsActivePort"), "utf8")).split("\n")[0],
  );
  const debugOrigin = `http://127.0.0.1:${activePort}`;
  const targetResponse = await fetch(`${debugOrigin}/json/new?${encodeURIComponent("about:blank")}`, {
    method: "PUT",
  });
  assert.equal(targetResponse.ok, true, "Chromium should open an isolated browser page");
  const target = await targetResponse.json();

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.once("open", resolve);
    socket.once("error", reject);
  });
  socket.on("message", (raw) => {
    const message = JSON.parse(raw.toString());
    if (!message.id) return;
    const command = pending.get(message.id);
    if (!command) return;
    pending.delete(message.id);
    if (message.error) command.reject(new Error(message.error.message));
    else command.resolve(message.result || {});
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.bringToFront");
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });
  await setViewport(1280, 1000, false);

  const fixtureResponsePatch = `(() => {
    const fixtureSlides = ${JSON.stringify(fixtureSlides)};
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const requestUrl = typeof input === "string" ? input : input.url;
      if (new URL(requestUrl, window.location.href).pathname === "/api/hero-slides") {
        return Promise.resolve(new Response(JSON.stringify(fixtureSlides), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }
      return originalFetch(input, init);
    };
  })();`;
  await send("Page.addScriptToEvaluateOnNewDocument", { source: fixtureResponsePatch });
  await send("Page.navigate", { url: baseUrl });

  await waitFor(async () => (await activeSlideTitle()) === "Organic Ingredients for Your Next Product", "the first built-in facility slide");
  await waitFor(
    async () => (await evaluate(`document.querySelectorAll('[aria-label="Choose a slide"] button').length`)) === 10,
    "the active managed fixture to join the nine facility slides",
  );
  assert.equal(
    await evaluate(`document.querySelectorAll('[aria-label="Choose a slide"] button').length`),
    10,
    "the carousel should contain nine facility slides followed by the one active CMS fixture",
  );

  await evaluate(`document.querySelector('[aria-label="Go to slide 9"]').click()`);
  await waitFor(async () => (await activeSlideTitle()) === "Ready for the Next Step", "the last built-in facility slide");
  await evaluate(`document.querySelector('[aria-label="Next slide"]').click()`);
  await waitFor(async () => (await activeSlideTitle()) === managedTitle, "the managed CMS slide after both facility slides");

  const managedSlideState = await evaluate(`(() => {
    const carousel = document.querySelector('section[aria-roledescription="carousel"]');
    const image = carousel?.querySelector('img');
    const panel = carousel?.querySelector('.grid > div:nth-child(2)');
    const title = carousel?.querySelector('h1');
    const subtitle = carousel?.querySelector('h2');
    const description = carousel?.querySelector('p');
    const ctas = [...(panel?.querySelectorAll('a') || [])];
    const visible = (element) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    return {
      imageLoaded: Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0),
      imagePosition: getComputedStyle(image).objectPosition,
      title: title?.textContent?.trim(),
      titleVisible: visible(title),
      subtitleVisible: visible(subtitle),
      descriptionVisible: visible(description),
      ctas: ctas.map((link) => ({
        label: link.textContent.trim(),
        href: new URL(link.href).pathname,
        visible: visible(link),
      })),
      activeIndicator: carousel?.querySelector('[aria-label="Choose a slide"] [aria-current="true"]')?.getAttribute('aria-label'),
    };
  })()`);
  assert.equal(managedSlideState.title, managedTitle);
  assert.equal(managedSlideState.imageLoaded, true, "the managed slide image should load");
  assert.equal(managedSlideState.imagePosition, "73% 28%", "the managed slide should use its saved focal position");
  assert.equal(managedSlideState.titleVisible, true, "the managed title should be visible");
  assert.equal(managedSlideState.subtitleVisible, true, "the managed subtitle should be visible");
  assert.equal(managedSlideState.descriptionVisible, true, "the managed description should be visible");
  assert.equal(managedSlideState.activeIndicator, "Go to slide 10", "the CMS indicator should be active");
  assert.deepEqual(
    managedSlideState.ctas.map(({ label, href, visible }) => ({ label, href, visible })),
    [
      { label: "Explore Products", href: "/products", visible: true },
      { label: "Talk to Our Team", href: "/contact", visible: true },
    ],
    "both CTA links should remain visible and point to their destinations on a managed slide",
  );

  for (const destination of ["/products", "/contact"]) {
    await evaluate(`document.querySelector('section[aria-roledescription="carousel"] a[href="${destination}"]').click()`);
    await waitFor(
      async () => (await evaluate(`window.location.pathname`)) === destination,
      `the managed slide CTA to open ${destination}`,
    );
    await send("Page.navigate", { url: baseUrl });
    await waitFor(async () => (await activeSlideTitle()) === "Organic Ingredients for Your Next Product", "the facility slide after returning from a CTA destination");
    await waitFor(
      async () => (await evaluate(`document.querySelectorAll('[aria-label="Choose a slide"] button').length`)) === 10,
      "the managed fixture after returning from a CTA destination",
    );
    await evaluate(`document.querySelector('[aria-label="Go to slide 10"]').click()`);
    await waitFor(async () => (await activeSlideTitle()) === managedTitle, "the managed slide after returning from a CTA destination");
  }

  await evaluate(`document.querySelector('[aria-label="Previous slide"]').click()`);
  await waitFor(async () => (await activeSlideTitle()) === "Ready for the Next Step", "the previous arrow to return from the managed slide");
  await evaluate(`document.querySelector('[aria-label="Next slide"]').click()`);
  await waitFor(async () => (await activeSlideTitle()) === managedTitle, "the next arrow to return to the managed slide");
  await evaluate(`document.querySelector('[aria-label="Go to slide 1"]').click()`);
  await waitFor(async () => (await activeSlideTitle()) === "Organic Ingredients for Your Next Product", "the first slide indicator");
  await evaluate(`document.querySelector('[aria-label="Go to slide 10"]').click()`);
  await waitFor(async () => (await activeSlideTitle()) === managedTitle, "the managed slide indicator");

  const slideGroup = await evaluate(
    `document.querySelector('[aria-roledescription="slide"]')?.getAttribute("aria-label")`,
  );
  assert.equal(
    slideGroup,
    "Slide 10 of 10: Managed Organic Turmeric for Global Formulations",
    "the current slide should have an accessible position and title",
  );
  assert.equal(
    await evaluate(`document.querySelector('[aria-label="Go to slide 10"]')?.getAttribute("aria-current")`),
    "true",
    "the current slide selector should be identified as current",
  );

  await evaluate(`document.querySelector('[aria-label="Previous slide"]').focus()`);
  await delay(100);
  assert.equal(
    await evaluate(`document.activeElement?.getAttribute("aria-label")`),
    "Previous slide",
    "the previous control should receive keyboard focus",
  );
  await pressKey("Enter");
  await waitFor(async () => (await activeSlideTitle()) === "Ready for the Next Step", "keyboard activation of the previous control");
  await evaluate(`document.querySelector('[aria-label="Next slide"]').focus()`);
  await pressKey("Enter");
  await waitFor(async () => (await activeSlideTitle()) === managedTitle, "keyboard activation of the next control");
  await evaluate(`document.querySelector('[aria-label="Go to slide 2"]').focus()`);
  await pressKey("Enter");
  await waitFor(async () => (await activeSlideTitle()) === "Let’s Plan Your Next Order", "keyboard activation of a slide selector");
  assert.equal(
    await evaluate(`document.querySelector('[aria-label="Go to slide 2"]')?.getAttribute("aria-current")`),
    "true",
    "keyboard slide selection should update the current indicator",
  );
  await evaluate(`document.querySelector('[aria-label="Go to slide 2"]').focus()`);
  await pressKey("Tab");
  assert.equal(
    await evaluate(`document.activeElement?.matches(":focus-visible")`),
    true,
    "keyboard tabbing should leave a visible focus target",
  );
  await evaluate(`document.querySelector('[aria-label="Pause automatic slide advance"]').focus()`);
  await pressKey("Enter");
  assert.equal(
    await evaluate(`document.querySelector('[aria-label="Resume automatic slide advance"]')?.getAttribute("aria-pressed")`),
    "true",
    "keyboard activation should pause automatic slide advance",
  );
  await pressKey("Enter");
  assert.equal(
    await evaluate(`document.querySelector('[aria-label="Pause automatic slide advance"]')?.getAttribute("aria-pressed")`),
    "false",
    "keyboard activation should resume automatic slide advance",
  );

  await evaluate(`document.querySelector('[aria-label="Go to slide 10"]').click()`);
  await waitFor(async () => (await activeSlideTitle()) === managedTitle, "the managed slide after keyboard controls");
  await evaluate(`document.querySelector('[aria-label="Pause automatic slide advance"]').click(); document.activeElement?.blur();`);
  assert.equal(
    await evaluate(`document.querySelector('[aria-label="Resume automatic slide advance"]')?.getAttribute('aria-pressed')`),
    "true",
    "the pause control should enter its paused state",
  );
  await delay(6200);
  assert.equal(await activeSlideTitle(), managedTitle, "the managed slide should not auto-advance while paused");
  await evaluate(`document.querySelector('[aria-label="Resume automatic slide advance"]').click();`);
  assert.equal(
    await evaluate(`document.querySelector('[aria-label="Pause automatic slide advance"]')?.getAttribute('aria-pressed')`),
    "false",
    "the pause control should resume automatic advance",
  );

  await evaluate(`document.querySelector('[aria-label="Pause automatic slide advance"]').click(); document.activeElement?.blur();`);
  await setViewport(390, 844, true);
  await delay(150);
  const mobileLayout = await evaluate(`(() => {
    const carousel = document.querySelector('section[aria-roledescription="carousel"]');
    const grid = carousel?.querySelector('.grid');
    const image = carousel?.querySelector('img');
    const copy = carousel?.querySelector('.grid > div:nth-child(2)');
    const title = carousel?.querySelector('h1');
    const description = carousel?.querySelector('p');
    const ctas = [...(copy?.querySelectorAll('a') || [])];
    const rect = (element) => {
      const value = element.getBoundingClientRect();
      return { top: value.top, bottom: value.bottom, left: value.left, right: value.right, width: value.width, height: value.height };
    };
    return {
      managedTitle: title?.textContent?.trim(),
      imageLoaded: Boolean(image?.complete && image.naturalWidth > 0),
      image: rect(image),
      copy: rect(copy),
      title: rect(title),
      description: rect(description),
      ctas: ctas.map((link) => ({ href: new URL(link.href).pathname, visible: link.getBoundingClientRect().width > 0 })),
      controlsVisible: ["Previous slide", "Next slide", "Go to slide 10"]
        .every((label) => {
          const control = carousel?.querySelector('[aria-label="' + label + '"]');
          return Boolean(control && control.getBoundingClientRect().width > 0 && control.getBoundingClientRect().height > 0);
        }) && Boolean(
          carousel?.querySelector('[aria-label="Pause automatic slide advance"], [aria-label="Resume automatic slide advance"]')
            ?.getBoundingClientRect().width,
        ),
      gridColumns: getComputedStyle(grid).gridTemplateColumns,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      gridRect: rect(grid),
    };
  })()`);
  assert.equal(mobileLayout.managedTitle, managedTitle, "the same managed slide should remain selected on mobile");
  assert.equal(mobileLayout.imageLoaded, true, "the managed image should remain loaded on mobile");
  assert.ok(mobileLayout.copy.top > mobileLayout.image.top, "the mobile split layout should stack text below the image");
  assert.ok(mobileLayout.title.top >= mobileLayout.copy.top && mobileLayout.description.bottom <= mobileLayout.copy.bottom, "managed text should stay inside the mobile copy panel");
  assert.ok(mobileLayout.documentWidth <= mobileLayout.viewportWidth, "the mobile carousel should not cause horizontal page overflow");
  assert.equal(mobileLayout.controlsVisible, true, "mobile arrows, indicators and pause control should remain visible");
  assert.deepEqual(
    mobileLayout.ctas,
    [{ href: "/products", visible: true }, { href: "/contact", visible: true }],
    "both CTA destinations should remain available on mobile",
  );
  await evaluate(`document.querySelector('[aria-label="Previous slide"]').click()`);
  await waitFor(async () => (await activeSlideTitle()) === "Ready for the Next Step", "the mobile previous arrow");
  await evaluate(`document.querySelector('[aria-label="Next slide"]').click()`);
  await waitFor(async () => (await activeSlideTitle()) === managedTitle, "the mobile next arrow");
  await evaluate(`document.querySelector('[aria-label="Go to slide 1"]').click()`);
  await waitFor(async () => (await activeSlideTitle()) === "Organic Ingredients for Your Next Product", "the mobile first indicator");
  await evaluate(`document.querySelector('[aria-label="Go to slide 10"]').click()`);
  await waitFor(async () => (await activeSlideTitle()) === managedTitle, "the mobile managed-slide indicator");

  await evaluate(`document.querySelector('[aria-label="Resume automatic slide advance"]')?.click(); document.activeElement?.blur();`);
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await delay(6200);
  assert.equal(
    await activeSlideTitle(),
    managedTitle,
    "automatic slide advance should stop when reduced motion is enabled while the page is open",
  );

  await setViewport(1280, 1000, false);
  await delay(150);
  const desktopPositions = await evaluate(`(() => {
    const carousel = document.querySelector('section[aria-roledescription="carousel"]');
    const image = carousel?.querySelector('img');
    const copy = carousel?.querySelector('.grid > div:nth-child(2)');
    const title = carousel?.querySelector('h1');
    const description = carousel?.querySelector('p');
    const imageRect = image.getBoundingClientRect();
    const copyRect = copy.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const descriptionRect = description.getBoundingClientRect();
    return {
      title: title.textContent.trim(),
      imageLeft: imageRect.left,
      imageRight: imageRect.right,
      copyLeft: copyRect.left,
      copyTop: copyRect.top,
      copyBottom: copyRect.bottom,
      titleTop: titleRect.top,
      descriptionBottom: descriptionRect.bottom,
    };
  })()`);
  assert.equal(desktopPositions.title, managedTitle);
  assert.ok(desktopPositions.copyLeft >= desktopPositions.imageRight - 1, "desktop should show the image and text in separate side-by-side columns");
  assert.ok(desktopPositions.titleTop >= desktopPositions.copyTop && desktopPositions.descriptionBottom <= desktopPositions.copyBottom, "managed text should stay inside the desktop copy panel");

  await send("Page.navigate", { url: baseUrl });
  await waitFor(async () => (await activeSlideTitle()) === "Organic Ingredients for Your Next Product", "the first slide with reduced motion enabled");
  await delay(6200);
  assert.equal(
    await activeSlideTitle(),
    "Organic Ingredients for Your Next Product",
    "automatic slide advance should remain off when reduced motion is enabled at page load",
  );

  console.log("Managed hero slide browser check passed (fixture only; no CMS records changed).");
} catch (error) {
  const details = chromiumErrorOutput ? `\nChromium output:\n${chromiumErrorOutput}` : "";
  throw new Error(`${error.message}${details}`, { cause: error });
} finally {
  socket?.close();
  chromium.kill("SIGTERM");
  await delay(100);
  if (chromium.exitCode === null) chromium.kill("SIGKILL");
  await rm(temporaryProfile, { recursive: true, force: true });
}
