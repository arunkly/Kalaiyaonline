import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 text-base leading-relaxed text-ink-soft">
      <p className="kicker">कानुन</p>
      <h1 className="font-display text-4xl font-normal text-ink">गोपनीयता नीति</h1>
      <p className="text-sm text-muted">अन्तिम अद्यावधिक: २०८३ भदौ २२</p>
      <p>
        KalaiyaOnline (“हामी”, “एप”) कलैया, बारा र मधेशका समाचार, ग्यालरी, डाइरेक्ट्री,
        च्याट र रक्तदाता सेवा सञ्चालन गर्छ। यो नीतिले हामी कुन जानकारी राख्छौं र किन
        भन्ने कुरा स्पष्ट पार्छ।
      </p>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">१. हामी के संकलन गर्छौं</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>खाता: नाम, इमेल, पासवर्ड (एन्क्रिप्टेड)।</li>
          <li>प्रोफाइल: फोटो, मोबाइल, ठेगाना, उमेर, स्ट्याटस।</li>
          <li>गतिविधि: समाचार कमेन्ट, लाइक/डिसलाइक, हेराइ गणना।</li>
          <li>च्याट: साथी अनुरोध र सन्देश।</li>
          <li>रक्तदाता/आकस्मिक अनुरोध: नाम, समूह, फोन, स्थान, उमेर, फोटो।</li>
          <li>सेभ गरिएका समाचार यसै यन्त्रमा (local storage) रहन्छन्।</li>
          <li>लगइन सत्र कुकी / टोकनबाट चल्छ।</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">२. किन प्रयोग गर्छौं</h2>
        <p>
          सेवा चलाउन, खाता चिन्न, कमेन्ट र च्याट देखाउन, रक्तदाता जोड्न, दुरुपयोग
          रोक्न र एप सुधार गर्न। हामी तपाईंको डेटा तेस्रो पक्षलाई बेच्दैनौं।
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">३. कसले देख्छ</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>समाचार, ग्यालरी, डाइरेक्ट्री र रक्तदाता सूची सार्वजनिक हुन सक्छन्।</li>
          <li>च्याट सन्देश सम्बन्धित प्रयोगकर्ताले मात्र देख्छन्।</li>
          <li>प्रशासकले खाता, भूमिका, विज्ञापन र सामग्री व्यवस्थापन गर्न सक्छ।</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">४. तेस्रो पक्ष</h2>
        <p>
          लगइन, इमेल रिकभरी, नक्सा (OpenStreetMap), सामाजिक सेयर (Facebook, X,
          WhatsApp) र विज्ञापन लिंक बाह्य साइटमा जान सक्छन्। ती साइटको आफ्नै नीति लागू हुन्छ।
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">५. कुकी र सूचना</h2>
        <p>
          सत्र कायम राख्न कुकी प्रयोग हुन्छ। एपभित्र सूचना घण्टी र ब्राउजर सूचना अनुमति
          माग्न सकिन्छ। अनुमति बिना पुश पठाइँदैन।
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">६. तपाईंका अधिकार</h2>
        <p>
          प्रोफाइल फोटो र विवरण अद्यावधिक गर्न सकिन्छ। खाता वा रक्तदाता रेकर्ड हटाउन
          प्रशासनलाई सम्पर्क गर्नुहोस्। पासवर्ड बिर्सिए रिकभरी इमेल प्रयोग गर्नुहोस्।
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">७. बालबालिका</h2>
        <p>यो एप सामान्य पाठकका लागि हो। १६ वर्षमुनिका बालबालिकालाई अभिभावकको सहमतिबिना खाता नखोल्न अनुरोध छ।</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">८. सम्पर्क</h2>
        <p>
          नीतिबारे प्रश्न भए <Link to="/about" className="text-crimson hover:underline">हाम्रोबारे</Link> मा
          दिइएको फोन, इमेल वा ठेगानामा लेख्नुहोस्।
        </p>
      </section>
    </article>
  );
}
