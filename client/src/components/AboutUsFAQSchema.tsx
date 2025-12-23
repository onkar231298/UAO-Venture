import { useEffect } from 'react';

export default function AboutUsFAQSchema() {
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What certifications does Bright Fame Organic hold?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Bright Fame Organic is certified by EU Organic, USDA NOP, JAS (Japan), NPOP, and India Organic. We also maintain ISO 9001:2015, ISO 22000:2018, HACCP, and GMP certifications for quality management."
          }
        },
        {
          "@type": "Question",
          "name": "What products does Bright Fame Organic supply?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We supply a complete range of organic products including herbs, spices, herbal extracts, essential oils, nutraceutical ingredients, organic seeds, and powders. Our products serve pharmaceutical, food manufacturing, and supplement industries worldwide."
          }
        },
        {
          "@type": "Question",
          "name": "Where are Bright Fame Organic's manufacturing facilities located?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We operate three main facilities: a High-End Processing Unit in Mehsana, Gujarat with 800 kg/hour capacity pulverizer lines; a Cumin Sorting Unit in Mehsana, Gujarat for whole spices grading; and a Solvent Extraction Plant in Krishnagiri District, Tamil Nadu for herbal extracts and plant-derived vitamins."
          }
        },
        {
          "@type": "Question",
          "name": "How much organic farmland does Bright Fame Organic manage?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We manage 950+ hectares of land under organic certification across multiple regions in India, ensuring sustainable cultivation practices and consistent supply of premium organic ingredients."
          }
        },
        {
          "@type": "Question",
          "name": "What industries does Bright Fame Organic serve?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We serve B2B customers in pharmaceutical companies, nutraceutical and supplement manufacturers, food manufacturing industry, herbal product companies, and cosmetic and personal care industry across global markets including EU, USA, Japan, and more."
          }
        },
        {
          "@type": "Question",
          "name": "Does Bright Fame Organic offer private labeling services?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, we offer private labeling, custom formulations, and bulk packaging options. We also provide complete documentation including COA (Certificate of Analysis), MSDS, and organic certificates for all products."
          }
        },
        {
          "@type": "Question",
          "name": "What shipping terms does Bright Fame Organic offer?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We offer flexible international shipping terms including FOB, CIF, and CFR. We have experience exporting to major markets worldwide and can accommodate various trade requirements."
          }
        },
        {
          "@type": "Question",
          "name": "How can I request a sample or quotation from Bright Fame Organic?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can request samples or quotations through our website's inquiry form or contact our sales team directly. We offer minimum order quantity flexibility and can provide product specifications and certificates for verified business inquiries."
          }
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqSchema);
    script.id = 'about-us-faq-schema';
    
    const existing = document.getElementById('about-us-faq-schema');
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('about-us-faq-schema');
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  return null;
}
