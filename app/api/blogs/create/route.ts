import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           
    .replace(/[^\w\-]+/g, '')       
    .replace(/\-\-+/g, '-')         
    .replace(/^-+/, '')             
    .replace(/-+$/, '');            
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      title, content, excerpt, authorName, 
      category, coverImage, seoTitle, seoDesc, 
      secretKey // <--- New Field
    } = body;

    // 1. SECURITY CHECK
    // If the key doesn't match .env, REJECT immediately. Nothing saved to DB.
    if (secretKey !== process.env.BLOG_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: "Invalid Authorization Token" }, 
        { status: 401 }
      );
    }

    // 2. Generate Slug
    let slug = slugify(title);
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    // 3. Create as APPROVED directly
    const blog = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        authorName,
        category,
        coverImage,
        seoTitle: seoTitle || title,
        seoDesc: seoDesc || excerpt,
        status: 'APPROVED' // <--- Instantly Live
      }
    });

    return NextResponse.json({ success: true, slug: blog.slug });

  } catch (error) {
    console.error("Blog Create Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}