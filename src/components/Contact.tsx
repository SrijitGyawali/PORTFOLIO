import { useRef, useState } from 'react'
import { profile } from '../data/profile'

export default function Contact() {
  const [copy, setCopy] = useState('COPY EMAIL')
  const emailRef = useRef<HTMLSpanElement>(null)
  async function copyEmail() {
    try { await navigator.clipboard.writeText(profile.email); setCopy('COPIED ✓') }
    catch { setCopy('SELECTED — COPY MANUALLY'); const range = document.createRange(); if (emailRef.current) { range.selectNodeContents(emailRef.current); const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range) } }
  }
  return <section id="contact" className="contact section-shell" aria-labelledby="contact-title">
    <div className="section-top"><span className="eyebrow">09 / OPEN CONNECTION</span><span className="availability"><i /> AVAILABLE FOR INTERESTING SYSTEMS</span></div>
    <p className="contact-intro">HAVE A HARD PROBLEM?</p><h2 id="contact-title" data-reveal>LET’S BUILD<br />SOMETHING<br /><span>THAT HAS TO SCALE.</span></h2>
    <div className="contact-bottom"><div className="email-block"><a href={`mailto:${profile.email}`} data-cursor="OPEN ↗"><span ref={emailRef}>{profile.email}</span><span aria-hidden="true">↗</span></a><button className="copy-email" onClick={copyEmail} aria-live="polite">{copy}</button></div><div className="social-links"><a href={profile.github} target="_blank" rel="noreferrer" data-cursor="CODE ↗">GITHUB <span>↗</span></a><a href={profile.linkedin} target="_blank" rel="noreferrer" data-cursor="OPEN ↗">LINKEDIN <span>↗</span></a></div></div>
    <footer><span>© {new Date().getFullYear()} SRIJIT GYAWALI</span><span>BUILT WITH INTENT.</span><a href="#home">BACK TO INITIALIZATION ↑</a></footer>
  </section>
}
