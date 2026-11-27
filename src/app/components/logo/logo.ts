import { Component, input } from '@angular/core';

type LogoSize = 'sm' | 'lg';

/**
 * Webshop Central logo: a striped "WC" monogram next to the name.
 * The stripes are a CSS mask over a gradient clipped to the letters, so it stays sharp at any size.
 */
@Component({
    selector: 'app-logo',
    template: `
        <div class="logo" [class.logo-sm]="size() === 'sm'" role="img" aria-label="Webshop Central">
            <span class="logo-mark" aria-hidden="true">WC</span>
            <span class="logo-text" aria-hidden="true">
                <span class="logo-name">Webshop Central</span>
            </span>
        </div>
    `,
    styles: `
        // Stripe settings, relative to the letter size (em), so both sizes look the same:
        //   --stripe: height of one colored bar
        //   --gap:    height of the empty line between two bars
        // e.g. 0.1em + 0.025em = thicker bars, 0.06em + 0.05em = thinner bars with wider gaps
        :host
            --stripe: 0.08em
            --gap: 0.04em

        .logo
            display: inline-flex
            align-items: center
            gap: 0.9rem

        // Striped monogram: gradient letters, cut into horizontal bars by a repeating mask
        .logo-mark
            font-family: Inter, system-ui, sans-serif
            font-weight: 900
            font-size: 5rem
            line-height: 0.8
            letter-spacing: -0.04em
            padding-bottom: 0.02em
            color: transparent
            background-image: linear-gradient(100deg, #059669 0%, #10b981 45%, #0ea5e9 100%)
            -webkit-background-clip: text
            background-clip: text
            -webkit-mask-image: repeating-linear-gradient(to bottom, #000 0 var(--stripe), transparent var(--stripe) calc(var(--stripe) + var(--gap)))
            mask-image: repeating-linear-gradient(to bottom, #000 0 var(--stripe), transparent var(--stripe) calc(var(--stripe) + var(--gap)))

        .logo-text
            display: flex
            flex-direction: column
            justify-content: center
            align-self: stretch
            padding-left: 0.9rem
            border-left: 2px solid #d1fae5

        .logo-name
            font-family: Inter, system-ui, sans-serif
            font-weight: 800
            font-size: 1.6rem
            line-height: 1.05
            letter-spacing: -0.02em
            color: #0f172a

        // Compact version (e.g. the navbar)
        .logo-sm
            --stripe: 0.1em
            --gap: 0.0777em
            gap: 0.5rem

            .logo-mark
                font-size: 1.9rem

            .logo-text
                padding-left: 0.5rem
                border-left-width: 1.5px

            .logo-name
                font-size: 1.05rem
    `,
})
export class Logo {
    readonly size = input<LogoSize>('lg');
}
