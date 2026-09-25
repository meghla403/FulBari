import Blog from '../components/Blog';
import Featured from '../components/Featured';
import Gallery from '../components/Gallery';
import Hero from '../components/Hero';
import Promo from '../components/Promo';
import Shop from '../components/Shop';
import StoreFeatures from '../components/StoreFeatures';
import Testimonials from '../components/Testimonials';
import VideoBanner from '../components/VideoBanner';
import useDocumentTitle from '../lib/useDocumentTitle';

export default function Home() {
  useDocumentTitle();
  return (
    <>
      <Hero />
      <Gallery />
      <Shop />
      <Promo />
      <Featured />
      <VideoBanner />
      <Testimonials />
      <Blog />
      <StoreFeatures />
    </>
  );
}
