import { Component, computed, input } from '@angular/core';
import { GlobalRole } from '../../types/enums';

type AvatarSize = 'sm' | 'md' | 'lg';

/** Role colors, from the validated categorical chart palette (also readable for color blind users). */
const ROLE_STYLES: Record<GlobalRole, { label: string; color: string; background: string }> = {
    SYSADMIN: { label: 'Administrator', color: '#6250d6', background: '#ebe8fb' },
    MODERATOR: { label: 'Moderator', color: '#eb6834', background: '#fdebe3' },
    USER: { label: 'User', color: '#2a78d6', background: '#e3eefb' },
};

const SIZES: Record<AvatarSize, number> = { sm: 28, md: 36, lg: 48 };

/**
 * Round user avatar; its color shows the global role of the user.
 * The color is never the only sign of the role: the role is written next to it (or in the tooltip).
 */
@Component({
    selector: 'app-user-avatar',
    template: `
        <span class="user-avatar" role="img"
            [attr.aria-label]="ariaLabel()" [attr.title]="ariaLabel()"
            [style.width.px]="pixels()" [style.height.px]="pixels()"
            [style.color]="style().color" [style.background-color]="style().background">
            <!-- Person silhouette; any SVG drawn with fill="currentColor" can replace it -->
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="62%" height="62%">
                <circle cx="12" cy="8" r="4.25" />
                <path d="M3.5 20.25c0-4.28 3.81-7.25 8.5-7.25s8.5 2.97 8.5 7.25c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25Z" />
            </svg>
        </span>
    `,
    styles: `
        .user-avatar
            display: inline-flex
            flex-shrink: 0
            align-items: center
            justify-content: center
            border-radius: 9999px
            box-shadow: inset 0 0 0 1.5px currentColor
    `,
})
export class UserAvatar {
    readonly role = input<GlobalRole | null | undefined>();
    readonly name = input<string | null | undefined>();
    readonly size = input<AvatarSize>('md');

    readonly style = computed(() => ROLE_STYLES[this.role() ?? 'USER'] ?? ROLE_STYLES.USER);
    readonly pixels = computed(() => SIZES[this.size()]);
    readonly ariaLabel = computed(() => [this.name(), this.style().label].filter(Boolean).join(', '));
}
