import type { CSSProperties } from 'react';
import styles from './Showcase.module.css';

const colorFamilies = ['blue', 'red', 'gold', 'green', 'neutral'] as const;
const steps = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10] as const;

const semanticGroups = [
  { title: 'Text', tokens: ['text-primary', 'text-secondary', 'text-tertiary', 'text-brand-primary', 'text-disabled', 'text-error', 'text-warning', 'text-info', 'text-success'] },
  { title: 'Surface', tokens: ['surface-primary', 'surface-secondary', 'surface-tertiary', 'surface-inverse-primary', 'surface-brand-primary-light', 'surface-brand-primary-dark', 'surface-error-light', 'surface-success-light', 'surface-warning-light', 'surface-info-light'] },
  { title: 'Border', tokens: ['border-primary', 'border-secondary', 'border-tertiary', 'border-focus', 'border-brand', 'border-error', 'border-success', 'border-warning', 'border-info'] },
  { title: 'Icon', tokens: ['icon-primary', 'icon-secondary', 'icon-brand-primary', 'icon-interactive', 'icon-disabled', 'icon-error', 'icon-success', 'icon-warning', 'icon-info'] },
] as const;

const typeScale = [
  ['Headline large', 'typography-headline-headline-large-semibold'],
  ['Headline medium', 'typography-headline-headline-medium-semibold'],
  ['Title large', 'typography-title-title-large-semibold'],
  ['Title medium', 'typography-title-title-medium-bold'],
  ['Body large', 'typography-body-body-large'],
  ['Body base', 'typography-body-body-base'],
  ['Body small', 'typography-body-body-small'],
  ['Label large', 'typography-labels-label-large'],
  ['Label small', 'typography-labels-label-small'],
  ['Caption bold', 'typography-caption-caption-bold'],
] as const;

const spaces = [4, 8, 12, 16, 24, 32, 40, 48, 64, 80] as const;
const radii = ['radius-2', 'radius-4', 'radius-8', 'radius-12', 'radius-16', 'radius-20', 'radius-40', 'radius-radius-full'] as const;
const shadows = [1, 2, 3, 4, 5, 6] as const;

const swatch = (token: string): CSSProperties => ({ background: `var(--${token})` });

export default function TokensShowcase() {
  return (
    <section className={styles.section} aria-labelledby="tokens-title">
      <h2 id="tokens-title" className={styles.sectionTitle}>Tokens</h2>
      <p className={styles.lead}>
        Three tiers: primitives hold raw values, semantic tokens map intent and switch per theme, and component
        tokens expose the knobs each component reads.
      </p>

      <h3 className={styles.subTitle}>Primitive colors</h3>
      <div className={styles.palettes}>
        {colorFamilies.map((family) => (
          <ul key={family} className={styles.palette} aria-label={`${family} palette`}>
            {steps.map((step) => (
              <li key={step} className={styles.paletteItem}>
                <span className={styles.paletteSwatch} style={swatch(`${family}-${step}`)} />
                <code>{family}-{step}</code>
              </li>
            ))}
          </ul>
        ))}
      </div>

      <h3 className={styles.subTitle}>Semantic colors</h3>
      <p className={styles.note}>These values follow the active theme. Toggle it from the header to compare.</p>
      <div className={styles.semanticGrid}>
        {semanticGroups.map((group) => (
          <div key={group.title}>
            <h4 className={styles.groupTitle}>{group.title}</h4>
            <ul className={styles.tokenList}>
              {group.tokens.map((token) => (
                <li key={token} className={styles.tokenRow}>
                  <span className={styles.tokenSwatch} style={swatch(token)} />
                  <code>--{token}</code>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h3 className={styles.subTitle}>Typography</h3>
      <ul className={styles.typeList}>
        {typeScale.map(([name, token]) => (
          <li key={token} className={styles.typeRow}>
            <span style={{ font: `var(--${token})`, fontFamily: 'var(--font-family-inter), sans-serif' }}>{name}</span>
            <code>--{token}</code>
          </li>
        ))}
      </ul>

      <h3 className={styles.subTitle}>Spacing</h3>
      <ul className={styles.tokenList}>
        {spaces.map((space) => (
          <li key={space} className={styles.tokenRow}>
            <span className={styles.spaceBar} style={{ inlineSize: `var(--space-${space})` }} />
            <code>--space-{space}</code>
          </li>
        ))}
      </ul>

      <h3 className={styles.subTitle}>Radius</h3>
      <ul className={styles.boxes}>
        {radii.map((radius) => (
          <li key={radius} className={styles.boxItem}>
            <span className={styles.radiusBox} style={{ borderRadius: `var(--${radius})` }} />
            <code>--{radius}</code>
          </li>
        ))}
      </ul>

      <h3 className={styles.subTitle}>Elevation</h3>
      <ul className={styles.boxes}>
        {shadows.map((level) => (
          <li key={level} className={styles.boxItem}>
            <span className={styles.shadowBox} style={{ boxShadow: `var(--effects-shadow-${level})` }} />
            <code>--effects-shadow-{level}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}
