import { Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Header from './components/Header';
import QuickView from './components/QuickView';
import ScrollManager from './components/ScrollManager';
import About from './pages/About';
import Account from './pages/Account';
import Article from './pages/Article';
import Cart from './pages/Cart';
import Contact from './pages/Contact';
import Home from './pages/Home';
import News from './pages/News';
import NotFound from './pages/NotFound';
import Product from './pages/Product';
import Register from './pages/Register';
import Search from './pages/Search';
import SignIn from './pages/SignIn';
import Wishlist from './pages/Wishlist';
import { useStore } from './store/StoreContext';

export default function App() {
  const { announcement } = useStore();

  return (
    // overflow-x-clip is a safety net only (it does not create a scroll container, so the fixed
    // header keeps working); the layouts themselves are built not to overflow.
    <div className="w-full max-w-full overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-lime focus:px-4 focus:py-3 focus:font-display focus:font-bold focus:text-white"
      >
        Skip to content
      </a>
      <ScrollManager />
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<Article />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shop/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/search" element={<Search />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<Account />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />

      <QuickView />
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
