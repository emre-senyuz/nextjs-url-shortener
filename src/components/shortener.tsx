'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Copy, Link2, LoaderCircle, MousePointer2, RefreshCw, Scissors, ShieldCheck, Trash2 } from 'lucide-react';
import type { Link } from '@/lib/db';

export default function Shortener() {
  const [links, setLinks] = useState<Link[]>([]);
  const [origin, setOrigin] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [notice, setNotice] = useState('');
  const [created, setCreated] = useState<Link | null>(null);
  const [copied, setCopied] = useState('');
  const [deleting, setDeleting] = useState('');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shortUrl = (slug: string) => `${origin}/s/${slug}`;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/links', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setLinks(data.links); setListError('');
    } catch { setListError('Could not load your links. Please refresh to try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => { window.removeEventListener('focus', onFocus); if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, [refresh]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to shorten this URL.');
      setCreated(data.link); setUrl(''); setNotice('Your short link is ready.');
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong. Try again.'); }
    finally { setBusy(false); }
  }
  async function copy(slug: string) {
    try {
      await navigator.clipboard.writeText(shortUrl(slug)); setCopied(slug); setNotice('Link copied to clipboard.');
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(''), 2200);
    } catch { setNotice('Clipboard unavailable. Select the short link and copy it manually.'); }
  }
  async function remove(link: Link) {
    if (!window.confirm(`Delete /s/${link.slug}? This short link will stop working. This cannot be undone.`)) return;
    setDeleting(link.slug); setListError('');
    try {
      const response = await fetch(`/api/links/${link.slug}`, { method: 'DELETE' });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error); }
      if (created?.slug === link.slug) setCreated(null);
      setNotice('Link deleted.'); await refresh();
    } catch (err) { setListError(err instanceof Error ? err.message : 'Could not delete link.'); }
    finally { setDeleting(''); }
  }

  return (
    <div className="site-shell">
      <header className="header">
        <a href="/" className="brand" aria-label="snip home"><span className="brand-mark"><Scissors size={22} strokeWidth={2.3} /></span>snip<span className="brand-dot">.</span></a>
        <div className="header-right"><span className="local-badge"><span /> LOCAL DEMO</span><a className="nav-link" href="#your-links">Your links <ArrowDown size={14} /></a></div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="eyebrow"><span className="tiny-line" /> LESS LINK. MORE POSSIBILITY.</div>
          <h1 id="hero-title">Good things.<br /><span>Short links.</span><span className="hero-spark" aria-hidden="true">✳</span></h1>
          <p className="hero-description">Give your long URLs a little breathing room.<br className="desktop-break" /> Shorten, copy, and keep them all in one place.</p>

          <div className="shorten-card">
            <div className="card-heading"><span className="icon-tile"><Link2 size={20} /></span><div><h2>Let’s make it short.</h2><p>A smaller link is just a paste away.</p></div><span className="step-number">01 / CREATE</span></div>
            <form onSubmit={create}>
              <label htmlFor="destination">Your long URL</label>
              <div className={`input-row ${error ? 'has-error' : ''}`}><Link2 size={20} aria-hidden="true" /><input id="destination" type="url" placeholder="https://example.com/something-wonderful" required maxLength={2048} value={url} onChange={e => { setUrl(e.target.value); setError(''); }} aria-invalid={Boolean(error)} aria-describedby={error ? 'url-error' : 'url-hint'} disabled={busy} /><button type="submit" className="primary-button" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} /> Shortening…</> : <>Shorten link <ArrowRight size={17} /></>}</button></div>
              {error && <p id="url-error" className="error" role="alert">{error}</p>}
              <p id="url-hint" className="input-hint"><ShieldCheck size={14} /> Public HTTP & HTTPS destinations only. No destination content is fetched.</p>
            </form>
            {created && <div className="result"><span className="result-label"><Check size={15} /> READY TO GO</span><div><a href={shortUrl(created.slug)} target="_blank" rel="noopener noreferrer">{shortUrl(created.slug)}</a><button className="copy-result" type="button" onClick={() => void copy(created.slug)}>{copied === created.slug ? <Check size={16} /> : <Copy size={16} />}{copied === created.slug ? 'Copied!' : 'Copy link'}</button></div></div>}
          </div>
          <div className="under-card"><span><span className="status-dot" /> Saved locally with SQLite</span><span>No account. No extra steps.</span></div>
        </section>

        <section id="your-links" className="links-section" aria-labelledby="links-title">
          <div className="section-heading"><div><div className="eyebrow small">A LITTLE MORE ORGANIZED</div><h2 id="links-title">Your links <span className="count-badge">{links.length}</span></h2></div><button type="button" className="refresh-button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh</button></div>
          <div className="list-card">
            <div className="table-heading"><span>LINK / DESTINATION</span><span>CLICKS</span><span>CREATED</span><span className="sr-only">Actions</span></div>
            {listError && <p className="error list-error" role="alert">{listError}</p>}
            {loading && links.length === 0 ? <div className="empty-state"><LoaderCircle className="spin" size={25} /><p>Getting your links…</p></div> : links.length === 0 && !listError ? <div className="empty-state"><div className="empty-illustration"><Link2 size={32} /><span><Scissors size={16} /></span></div><h3>A fresh start for your links.</h3><p>Paste your first URL above.<br />We’ll keep its shorter side right here.</p><span className="empty-note">LONG STORY, SHORT LINK.</span></div> : links.map(link => <div className="link-row" key={link.slug}>
              <div className="link-detail"><span className="row-icon"><Link2 size={19} /></span><div><a className="short-link" href={shortUrl(link.slug)} target="_blank" rel="noopener noreferrer">{shortUrl(link.slug)}<ArrowUpRight size={14} /></a><p title={link.url}>{link.url}</p></div></div>
              <span className="click-count"><MousePointer2 size={13} />{link.clicks}<span className="mobile-label"> clicks</span></span>
              <time dateTime={link.createdAt}>{new Date(link.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
              <div className="row-actions"><button className="icon-button" title={copied === link.slug ? 'Copied' : 'Copy link'} aria-label={`Copy short link ${link.slug}`} onClick={() => void copy(link.slug)}>{copied === link.slug ? <Check size={17} /> : <Copy size={17} />}</button><button className="icon-button delete-button" title="Delete link" aria-label={`Delete short link ${link.slug}`} disabled={deleting === link.slug} onClick={() => void remove(link)}>{deleting === link.slug ? <LoaderCircle className="spin" size={17} /> : <Trash2 size={17} />}</button></div>
            </div>)}
            <div className="list-footer"><span>Showing your 50 most recent links</span><span><span className="status-dot" /> Stored on this device</span></div>
          </div>
          <p className="local-note"><ShieldCheck size={15} /><span>This is a local demo. Short links work wherever this running app is reachable.<br />Anyone with access to this instance can view, create, and delete links.</span></p>
        </section>
      </main>
      <footer><span className="footer-brand">snip.</span><span>Keep it simple. Make it shorter.</span><span className="footer-end">BUILT FOR THE LITTLE THINGS <span aria-hidden="true">↗</span></span></footer>
      <div className="sr-only" role="status" aria-live="polite">{notice}</div>
      {notice && <div className="toast" role="presentation"><Check size={15} /><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}
    </div>
  );
}
