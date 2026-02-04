import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, User, Clock, Share2, HeartPulse, Stethoscope, BookOpen } from 'lucide-react';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

// 1. Dynamic SEO Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = await prisma.blogPost.findUnique({ where: { slug } });

  if (!blog) return { title: 'Healthcare Article Not Found' };

  return {
    title: `${blog.title} | WayToLab Health Blog`,
    description: blog.seoDesc || blog.excerpt,
    keywords: ['healthcare', 'diagnostic', 'wellness', 'medical', 'health tips', blog.category],
    authors: [{ name: blog.authorName }],
    openGraph: {
      type: 'article',
      title: blog.title,
      description: blog.excerpt,
      publishedTime: blog.createdAt.toISOString(),
      authors: [blog.authorName],
      tags: [blog.category],
      images: blog.coverImage ? [blog.coverImage] : [],
    },
  };
}

export default async function SingleBlogPage({ params }: Props) {
  const { slug } = await params;

  // 2. Fetch Data (Server Side)
  const blog = await prisma.blogPost.findUnique({
    where: { slug }
  });

  // 3. Security: Only show if APPROVED
  if (!blog || blog.status !== 'APPROVED') {
    return notFound();
  }

  // Format date for display
  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Estimate reading time (assuming 200 words per minute)
  const wordCount = blog.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/10 via-white to-slate-50">
      
      {/* Healthcare Progress Bar */}
      <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-teal-600 z-50 w-full origin-left scale-x-0 animate-scroll-progress" />

      {/* Healthcare Hero Section */}
      <div className="relative pt-24 pb-20 px-4 bg-gradient-to-r from-teal-700 via-teal-600 to-teal-700 text-white overflow-hidden">
        {/* Medical pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }} />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Healthcare Navigation */}
          <div className="flex justify-between items-center mb-10">
            <Link 
              href="/blogs" 
              className="inline-flex items-center gap-2 text-teal-100 hover:text-white transition-colors group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Health Insights</span>
            </Link>
            
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <HeartPulse size={14} className="text-teal-200" />
              <span className="text-xs font-bold">Healthcare Article</span>
            </div>
          </div>

          {/* Healthcare Category Badge */}
          <div className="mb-6">
            <span className="inline-block bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
              {blog.category}
            </span>
          </div>

          {/* Article Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
            {blog.title}
          </h1>

          {/* Healthcare Excerpt */}
          <div className="text-xl text-teal-100 leading-relaxed max-w-3xl mb-10 border-l-4 border-teal-400 pl-6">
            {blog.excerpt}
          </div>

          {/* Healthcare Author & Meta Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-6 border-t border-teal-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {blog.authorName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-white">{blog.authorName}</p>
                <p className="text-sm text-teal-200">Healthcare Writer</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-teal-200">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-teal-300" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-teal-300" />
                <span>{readingTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-teal-300" />
                <span>{wordCount.toLocaleString()} words</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {blog.coverImage && (
        <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-teal-200/30 border border-teal-100">
            <Image
              src={blog.coverImage}
              alt={blog.title}
              width={1200}
              height={600}
              sizes="(max-width: 1024px) 100vw, 800px"
              className="w-full h-auto max-h-[500px] object-cover"
              unoptimized
            />
            {/* Gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>
      )}

      {/* Healthcare Content */}
      <article className="max-w-3xl mx-auto px-4 py-16">
        <div 
          className="prose prose-lg prose-slate max-w-none 
            prose-headings:font-bold prose-headings:text-slate-900 prose-headings:mt-12 prose-headings:mb-6
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
            prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-lg
            prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
            prose-strong:text-slate-900 prose-strong:font-bold
            prose-ul:mt-6 prose-ul:space-y-2 prose-li:text-slate-700
            prose-blockquote:border-l-4 prose-blockquote:border-teal-400 prose-blockquote:pl-6 
            prose-blockquote:py-4 prose-blockquote:bg-teal-50/50 prose-blockquote:text-slate-700
            prose-img:rounded-2xl prose-img:shadow-lg prose-img:border prose-img:border-slate-200
            prose-hr:my-12 prose-hr:border-slate-200"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Healthcare Article Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          {/* Healthcare Tags */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Stethoscope size={20} className="text-teal-600" />
              Healthcare Topics
            </h4>
            <div className="flex flex-wrap gap-2">
              {[blog.category, 'Diagnostics', 'Wellness', 'Preventive Care', 'Health Tips'].map((tag, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 bg-gradient-to-r from-teal-50 to-blue-50 text-teal-700 rounded-full text-sm font-medium border border-teal-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Share & Author Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 bg-gradient-to-r from-teal-50 to-white rounded-2xl border border-teal-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {blog.authorName.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Written by {blog.authorName}</h4>
                <p className="text-sm text-slate-600">Healthcare expert at WayToLab</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <p className="font-bold text-slate-800 text-lg mb-2">Share Health Knowledge</p>
                <div className="flex gap-3">
                  <button className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 hover:bg-teal-200 transition-colors">
                    <Share2 size={20} />
                  </button>
                  <button className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors">
                    <span className="font-bold">f</span>
                  </button>
                  <button className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 hover:bg-sky-200 transition-colors">
                    <span className="font-bold">in</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Healthcare CTA */}
          <div className="mt-10 text-center">
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 border border-teal-100">
              <HeartPulse size={40} className="mx-auto mb-4 text-teal-600" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Need Medical Consultation?</h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Discuss your health concerns with certified doctors. Book a consultation through WayToLab.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/search"
                  className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3.5 rounded-xl font-bold hover:shadow-xl hover:shadow-teal-200 transition-all"
                >
                  Book Diagnostic Test
                </Link>
                <Link 
                  href="/contact"
                  className="bg-white border-2 border-teal-200 text-teal-700 px-8 py-3.5 rounded-xl font-bold hover:bg-teal-50 transition-all"
                >
                  Talk to Health Expert
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
