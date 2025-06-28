import { getCSSVariableByRegex, getHiddenElementDimensions, getViewport, getWindowScrollLeft, getWindowScrollTop, isRTL } from '@primeuix/utils';

export function absolutePositionForDatePicker(element: HTMLElement, target: HTMLElement, gutter: boolean = true): void {
    if (element) {
        let origin = 'top';

        if (!!element.closest('[dir="rtl"]')) {
            element.style.right = '0px';
            element.style.left = 'auto';
        } else {
            element.style.left = '0px';
            element.style.right = 'auto';
        }

        element.style.top = '100%';
        element.style.transformOrigin = origin;
        const CSSVariable = getCSSVariableByRegex(/-anchor-gutter$/)?.value;
        if (gutter) element.style.marginTop = origin === 'bottom' ? `calc(${CSSVariable ?? '2px'} * -1)` : (CSSVariable ?? '');
    }
}

export function absolutePosition(element: HTMLElement, target: HTMLElement, gutter: boolean = true): void {
    if (element) {
        const elementDimensions = element.offsetParent ? { width: element.offsetWidth, height: element.offsetHeight } : getHiddenElementDimensions(element);
        const elementOuterHeight = elementDimensions.height;
        const elementOuterWidth = elementDimensions.width;
        const targetOuterHeight = target.offsetHeight;
        const targetOuterWidth = target.offsetWidth;
        const targetOffset = target.getBoundingClientRect();
        const windowScrollTop = getWindowScrollTop();
        const windowScrollLeft = getWindowScrollLeft();
        const viewport = getViewport();
        let top: number,
            left: number,
            right: number,
            origin = 'top';

        if (targetOffset.top + targetOuterHeight + elementOuterHeight > viewport.height) {
            top = targetOffset.top + windowScrollTop - elementOuterHeight;
            origin = 'bottom';

            if (top < 0) {
                top = windowScrollTop;
            }
        } else {
            top = targetOuterHeight + targetOffset.top + windowScrollTop;
        }

        if (isRTL(element)) {
            if (targetOffset.right + elementOuterWidth > viewport.width) right = Math.max(0, targetOffset.right + windowScrollLeft + targetOuterWidth - elementOuterWidth);
            else right = targetOffset.right + windowScrollLeft - elementOuterWidth;
            element.style.insetInlineEnd = right + 'px';
        } else {
            if (targetOffset.left + elementOuterWidth > viewport.width) left = Math.max(0, targetOffset.left + windowScrollLeft + targetOuterWidth - elementOuterWidth);
            else left = targetOffset.left + windowScrollLeft;
            element.style.insetInlineStart = left + 'px';
        }

        element.style.top = top + 'px';
        element.style.transformOrigin = origin;
        if (gutter) element.style.marginTop = origin === 'bottom' ? `calc(${getCSSVariableByRegex(/-anchor-gutter$/)?.value ?? '2px'} * -1)` : (getCSSVariableByRegex(/-anchor-gutter$/)?.value ?? '');
    }
}
