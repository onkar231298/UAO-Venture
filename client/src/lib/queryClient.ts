import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

type ApiRequestOptions = {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
};

export function apiRequest(url: string, options?: ApiRequestOptions): Promise<Response>;
export function apiRequest(method: string, url: string, data?: unknown): Promise<Response>;
export async function apiRequest(
  url: string,
  optionsOrUrl?: ApiRequestOptions | string,
  data?: unknown,
): Promise<Response> {
  // Older CRM forms use (method, url, data); newer forms use (url, options).
  // Explicitly support both so a method can never become the fetch URL.
  const methodFirst = typeof optionsOrUrl === "string";
  const requestUrl = methodFirst ? optionsOrUrl : url;
  const options: ApiRequestOptions | undefined = methodFirst
    ? { method: url, body: data === undefined ? undefined : JSON.stringify(data) }
    : optionsOrUrl;
  if (methodFirst && !/^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$/i.test(url)) {
    throw new Error("Invalid API request method");
  }
  const res = await fetch(requestUrl, {
    method: options?.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: options?.body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build URL from query key
    let url = queryKey[0] as string;
    
    // If there are query parameters in the second element, append them as query string
    if (queryKey.length > 1 && typeof queryKey[1] === 'object' && queryKey[1] !== null) {
      const params = new URLSearchParams();
      const queryParams = queryKey[1] as Record<string, any>;
      
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    } else if (queryKey.length > 1) {
      // If it's not an object, join with "/"
      url = queryKey.join("/");
    }

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
