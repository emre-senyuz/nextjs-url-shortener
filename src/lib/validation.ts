import { z } from 'zod';
import ipaddr from 'ipaddr.js';

export const slugSchema = z.string().regex(/^[A-Za-z0-9]{7}$/);
export function safeDestination(value: string): boolean {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
    if (ipaddr.isValid(host)) return ipaddr.parse(host).range() === 'unicast';
    if (!host.includes('.') || /(^|\.)(localhost|local|internal|lan|home|test|invalid|onion)$/.test(host)) return false;
    return host.split('.').every(part => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(part));
  } catch { return false; }
}
export const createSchema = z.object({
  url: z.string().trim().min(1, 'Enter a URL to shorten.').max(2048, 'Use a URL under 2,049 characters.')
    .refine(safeDestination, 'Enter a public HTTP or HTTPS URL. Local and private destinations are blocked.')
    .transform(value => new URL(value).href),
});
