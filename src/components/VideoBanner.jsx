import { useState } from 'react';
import { SITE } from '../data/site';
import Container from './Container';
import { PlayIcon } from './Icons';
import Modal from './Modal';

// The banner straddles two backgrounds: white above, cream below (like the reference).
export default function VideoBanner() {
  const [open, setOpen] = useState(false);

  return (
    <section aria-label="Watch our story" className="relative bg-cream">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[70%] bg-white" />
      <Container className="relative">
        <div className="relative mx-auto aspect-video w-full overflow-hidden lg:aspect-[2/1]">
          <img
            src="/images/video.svg"
            alt="A field of colourful roses and daisies"
            width="1280"
            height="720"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
          <button
            type="button"
            aria-label="Play video"
            onClick={() => setOpen(true)}
            className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center bg-white text-lime shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 md:size-16 lg:size-20"
          >
            <span aria-hidden="true" className="pointer-events-none absolute -inset-1.5 border-2 border-white/80 lg:-inset-3" />
            <PlayIcon className="size-5 lg:size-7" />
          </button>
        </div>
      </Container>

      <Modal open={open} onClose={() => setOpen(false)} label="Video" className="w-[min(92vw,900px)] bg-ink">
        <div className="aspect-video w-full">
          {SITE.videoEmbedUrl ? (
            <iframe
              src={SITE.videoEmbedUrl}
              title="Our story"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="size-full"
            />
          ) : (
            <p className="grid h-full place-items-center p-6 text-center text-sm text-white/80 md:text-base">
              Our story video is coming soon.
            </p>
          )}
        </div>
      </Modal>
    </section>
  );
}
