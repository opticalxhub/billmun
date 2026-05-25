import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Footer } from '@/components/footer';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { LandingGalleryItem } from '@/components/marketing/landing-hero';

const LandingHero = dynamic(() => import('@/components/marketing/landing-hero').then(mod => mod.LandingHero), {
  ssr: true,
  loading: () => <div className="h-screen bg-bg-base" />
});

import TeamVideo from '@/components/marketing/team-video';

async function getLandingGalleryItems(): Promise<LandingGalleryItem[]> {
  const { data } = await supabaseAdmin
    .from('media_gallery')
    .select('id, media_url, caption, media_type, status')
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false })
    .limit(12);

  return (data as LandingGalleryItem[] | null) || [];
}

export default async function LandingPage() {
  const gallery = await getLandingGalleryItems();

  return (
    <div className="flex min-h-screen flex-col bg-bg-base font-jotia text-text-primary">
      <LandingHero gallery={gallery} />

      <section id="about" className="bg-bg-card/30 px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="mb-6 text-lg leading-relaxed">
            <strong>NXTMUN</strong> is a student led Model United Nations initiative built around the idea of <strong>Build Inspire Lead</strong>. These three words represent our approach to conference design and student development.
          </p>
          <div className="mb-6 space-y-4">
            <p className="text-lg leading-relaxed">
              <strong>Build</strong> reflects our belief that every delegate should have the opportunity to grow.
            </p>
            <p className="text-lg leading-relaxed">
              <strong>Inspire</strong> stands for the professional environment we work to create in every committee room.
            </p>
            <p className="text-lg leading-relaxed">
              <strong>Lead</strong> represents our commitment to encouraging new ideas, new leaders and new perspectives.
            </p>
          </div>
          <p className="mb-12 text-lg leading-relaxed">
            Our aim is to raise the standard of MUN in the region and provide a platform where students engage with international issues in a disciplined, well structured and academically strong setting.
          </p>
          <div className="mb-12">
            <h2 className="mb-6 text-3xl font-bold">NXTMUN II</h2>
            <p className="mb-4 text-lg leading-relaxed">
              NXTMUN I, scheduled for <strong>3-4 April</strong>, marks the official launch of the conference. As our second edition, it represents the foundation of a long-term vision to establish a leading Model United Nations platform.
            </p>
            <p className="mb-4 text-lg leading-relaxed">
              The conference is structured to deliver a focused and high-quality debate experience, bringing together delegates across multiple committees within a professional and well-regulated setting.
            </p>
            <p className="mb-4 text-lg leading-relaxed">
              With an emphasis on clarity, organization and academic depth, NXTMUN I is designed not only to meet expectations, but to set a new benchmark for student-led conferences in the region.
            </p>
            <p className="text-lg leading-relaxed">
              This first conference is more than a starting point; it is the standard upon which all future NXTMUN initiatives will be built.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold sm:text-4xl">Latest Announcements</h2>
          <div className="rounded-xl border border-border-subtle bg-bg-card/50 p-8 text-center">
            <p className="text-text-secondary">Stay tuned for official announcements about NXTMUN I.</p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-full bg-text-primary px-8 py-3 font-bold uppercase tracking-widest text-bg-base transition-colors hover:bg-text-primary/90"
            >
              Enter Portal
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-bg-card/30 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-4xl tracking-tight sm:text-5xl">MEET THE TEAM</h2>
          <TeamVideo />
          <p className="mt-8 text-center text-sm uppercase tracking-widest text-text-secondary">
            Get to know the Executive Board behind NXTMUN
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

