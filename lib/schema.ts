import { absoluteUrl } from '@/lib/seo';

type ContactPointInput = {
  contactType: string;
  telephone?: string;
  email?: string;
  areaServed?: string | string[];
  availableLanguage?: string[];
};

type AddressInput = {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
};

export type FaqEntry = {
  question: string;
  answer: string;
};

export type BreadcrumbEntry = {
  name: string;
  item: string;
};

export type LabSchemaInput = {
  id: number;
  name: string;
  description?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  timings?: unknown;
};

export const ORG_SCHEMA_CONFIG = {
  id: absoluteUrl('/#organization'),
  name: 'WayToLab',
  legalName: 'Waytolab Healthcare',
  description:
    'WayToLab is a diagnostic test booking platform serving Gurugram, Gurgaon, and Delhi NCR with trusted labs, transparent pricing, home sample collection, and digital reports.',
  logoUrl: absoluteUrl('/logo.png'),
  imageUrl: absoluteUrl('/logo.png'),
  email: 'care@waytolab.com',
  phone: '+919311213388',
  sameAs: [
    'https://www.facebook.com/way2lab',
    'https://x.com/way2lab',
    'https://in.linkedin.com/company/way2lab',
    'https://www.instagram.com/way2lab'
  ],
  address: {
    streetAddress: '114, Vipul Business Park, Sector 48',
    addressLocality: 'Gurugram',
    addressRegion: 'Haryana',
    postalCode: '122018',
    addressCountry: 'IN'
  } satisfies AddressInput,
  contactPoints: [
    {
      contactType: 'customer support',
      telephone: '+919311213388',
      email: 'care@waytolab.com',
      areaServed: ['Gurugram', 'Gurgaon', 'Delhi', 'Delhi NCR', 'IN'],
      availableLanguage: ['en', 'hi']
    }
  ] satisfies ContactPointInput[]
};

function clean<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((v) => clean(v))
      .filter((v) => v !== undefined && v !== null && v !== '') as T;
  }

  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const c = clean(v);
      if (c !== undefined && c !== null && c !== '') {
        next[k] = c;
      }
    }
    return next as T;
  }

  return value;
}

function buildPostalAddress(address: AddressInput) {
  return clean({
    '@type': 'PostalAddress',
    streetAddress: address.streetAddress,
    addressLocality: address.addressLocality,
    addressRegion: address.addressRegion,
    postalCode: address.postalCode,
    addressCountry: address.addressCountry || 'IN'
  });
}

function buildOpeningHours(timings: unknown): string[] | undefined {
  if (!timings) return undefined;
  if (!Array.isArray(timings)) return undefined;

  const dayMap: Record<string, string> = {
    monday: 'Mo',
    tuesday: 'Tu',
    wednesday: 'We',
    thursday: 'Th',
    friday: 'Fr',
    saturday: 'Sa',
    sunday: 'Su'
  };

  const rows = timings
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const obj = row as Record<string, unknown>;
      const dayRaw = String(obj.day || obj.dayName || '').trim().toLowerCase();
      const open = String(obj.open || obj.start || obj.from || '').trim();
      const close = String(obj.close || obj.end || obj.to || '').trim();
      const day = dayMap[dayRaw];
      if (!day || !open || !close) return null;
      return `${day} ${open}-${close}`;
    })
    .filter(Boolean) as string[];

  return rows.length ? rows : undefined;
}

export function buildOrganizationSchema() {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_SCHEMA_CONFIG.id,
    name: ORG_SCHEMA_CONFIG.name,
    legalName: ORG_SCHEMA_CONFIG.legalName,
    description: ORG_SCHEMA_CONFIG.description,
    url: absoluteUrl('/'),
    logo: ORG_SCHEMA_CONFIG.logoUrl,
    image: ORG_SCHEMA_CONFIG.imageUrl,
    email: ORG_SCHEMA_CONFIG.email,
    telephone: ORG_SCHEMA_CONFIG.phone,
    areaServed: ['Gurugram', 'Gurgaon', 'Delhi', 'Delhi NCR', 'IN'],
    sameAs: ORG_SCHEMA_CONFIG.sameAs,
    address: buildPostalAddress(ORG_SCHEMA_CONFIG.address),
    contactPoint: ORG_SCHEMA_CONFIG.contactPoints.map((cp) =>
      clean({
        '@type': 'ContactPoint',
        contactType: cp.contactType,
        telephone: cp.telephone,
        email: cp.email,
        areaServed: cp.areaServed,
        availableLanguage: cp.availableLanguage
      })
    )
  });
}

export function buildWebsiteSchema() {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    name: ORG_SCHEMA_CONFIG.name,
    description: ORG_SCHEMA_CONFIG.description,
    url: absoluteUrl('/'),
    inLanguage: 'en-IN',
    publisher: { '@id': ORG_SCHEMA_CONFIG.id },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/search')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  });
}

export function buildLabSchema(input: LabSchemaInput) {
  return clean({
    '@context': 'https://schema.org',
    '@type': ['DiagnosticLab', 'MedicalBusiness'],
    '@id': absoluteUrl(`/labs/${input.id}#lab`),
    name: input.name,
    description: input.description,
    url: absoluteUrl(`/labs/${input.id}`),
    image: ORG_SCHEMA_CONFIG.imageUrl,
    telephone: input.phone,
    email: input.email,
    parentOrganization: { '@id': ORG_SCHEMA_CONFIG.id },
    address: buildPostalAddress({
      streetAddress: input.address || undefined,
      addressLocality: input.city || undefined,
      addressRegion: input.state || undefined,
      postalCode: input.pincode || undefined,
      addressCountry: 'IN'
    }),
    geo:
      input.latitude != null && input.longitude != null
        ? {
            '@type': 'GeoCoordinates',
            latitude: input.latitude,
            longitude: input.longitude
          }
        : undefined,
    openingHours: buildOpeningHours(input.timings),
    aggregateRating:
      Number(input.reviewCount || 0) > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(input.rating || 0),
            reviewCount: Number(input.reviewCount || 0)
          }
        : undefined
  });
}

export function buildFaqSchema(entries: FaqEntry[]) {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer
      }
    }))
  });
}

export function buildBreadcrumbSchema(entries: BreadcrumbEntry[]) {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: entry.item
    }))
  });
}
