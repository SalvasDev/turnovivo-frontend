import Image from 'next/image';
import { HomeActions } from '@/components/home-actions';
import { DEFAULT_DEMO_NAME } from '@/config/app';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.home}>
      <Image
        src="/sphera.png"
        alt=""
        width={918}
        height={1098}
        sizes="(max-width: 960px) 100vw, 960px"
        priority
        className={styles.heroImage}
      />
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.copy}>
          <p className={styles.pill}>
            <span>TURNOVIVO MVP</span>
            <span className={styles.pillDot} aria-hidden="true" />
            <span className={styles.pillDescription}>INTELLIGENT AGENDA ANTI NO-SHOW</span>
          </p>
          <h1 id="home-title" className={styles.title}>
            <span className={styles.titleLine}>Manage <span className={styles.accent}>appointments</span></span>
            <span className={styles.titleLine}>without losing control</span>
            <span className={styles.titleLine}>of your <span className={styles.accent}>schedule</span></span>
          </h1>
          <p className={styles.description}>
            A functional demo showcasing reservations, waitlists, cancellations,
            and slot management, built using Redis and Java. Designed as a
            portfolio MVP, it allows users to jump in, test the workflow, and
            grasp its value in just a few minutes.
          </p>
          <HomeActions />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="technology-title">
        <h2 id="technology-title" className={styles.sectionTitle}>How TurnoVivo is built</h2>
        <div className={styles.features}>
          <article className={styles.feature}>
            <p className={styles.eyebrow}>Design</p>
            <h3>Figma + Design system</h3>
            <p className={styles.featureDescription}>Reusable components built with the Ocean Design System.</p>
          </article>
          <article className={styles.feature}>
            <p className={styles.eyebrow}>Backend</p>
            <h3>Spring Boot + JPA</h3>
            <p className={styles.featureDescription}>Authentication, slots, and centralized business rules.</p>
          </article>
          <article className={styles.feature}>
            <p className={styles.eyebrow}>Real time</p>
            <h3>Redis in action</h3>
            <p className={styles.featureDescription}>Cancellation cascades and automatic hold expiration.</p>
          </article>
          <article className={styles.feature}>
            <p className={styles.eyebrow}>Frontend</p>
            <h3>Next.js + CSS Modules</h3>
            <p className={styles.featureDescription}>Server-rendered components and the Ocean Design System.</p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="demo-title">
        <h2 id="demo-title" className={styles.sectionTitle}>See what&apos;s possible</h2>
        <div className={styles.demoGrid}>
          <article className={styles.demo}>
            <div className={styles.demoTop}>
              <p className={styles.eyebrow}>Available demo</p>
              <code className={styles.password}>password123</code>
            </div>
            <h3 className={styles.demoTitle}>{DEFAULT_DEMO_NAME}</h3>
            <div className={styles.credentials}>
              <strong>Demo credentials:</strong>
              <ul>
                <li>cliente.real@turnovivo.com</li>
                <li>admin@turnovivo.com</li>
                <li>super.admin@turnovivo.com</li>
              </ul>
            </div>
          </article>
          <article className={`${styles.demo} ${styles.demoInfo}`}>
            <h3 className={styles.eyebrow}>What could you try</h3>
            <ul className={styles.tryList}>
              <li>Reserve an available appointment</li>
              <li>Join and leave the waitlist</li>
              <li>Cancel an appointment and see the cascade</li>
              <li>Review the admin dashboard</li>
              <li>Manage companies</li>
            </ul>
          </article>
          <article className={`${styles.demo} ${styles.demoInfo}`}>
            <h3 className={styles.eyebrow}>MVP portfolio</h3>
            <ul className={`${styles.tryList} ${styles.portfolioCopy}`}>
              <li>This is not a final product.</li>
              <li>
                The focus is to demonstrate architecture, user flow, operational
                control, and Design System implementation.
              </li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
