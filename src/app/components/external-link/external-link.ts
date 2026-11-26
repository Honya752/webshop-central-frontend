import { Component, input } from '@angular/core';

// Link to an outside page: opens in a new tab, with an arrow icon after the text.
// Without projected text only the icon is shown (e.g. next to an internal link).
@Component({
    selector: 'app-external-link',
    template: `
        @if (href(); as url) {
            <a class="link-text external-link" [href]="url" target="_blank" rel="noopener noreferrer"
                [attr.title]="title() ?? 'Opens in a new tab'" [attr.aria-label]="title() ?? null">
                <ng-content /><i class="pi pi-external-link" aria-hidden="true"></i>
            </a>
        } @else {
            <span>{{ fallback() }}</span>
        }
    `,
})
export class ExternalLink {
    readonly href = input<string | null | undefined>();
    readonly title = input<string>();
    // shown when there is no URL
    readonly fallback = input('-');
}
