import Button from '../components/Button';
import PageBanner from '../components/PageBanner';
import Section from '../components/Section';
import SmartLink from '../components/SmartLink';
import useDocumentTitle from '../lib/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <>
      <PageBanner label="Oops" title="Page not found" crumbs={[{ label: 'Home', to: '/' }, { label: '404' }]} />
      <Section>
        <div className="mx-auto max-w-md text-center">
          <p className="text-sm leading-[1.8] md:text-base">
            We could not find the page you were looking for. It may have moved, or the address may be mistyped.
          </p>
          <Button as={SmartLink} to="/" size="lg" className="mt-6">
            Back to home
          </Button>
        </div>
      </Section>
    </>
  );
}
