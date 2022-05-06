import { FontSizes, FontWeights } from '@fluentui/react';
import {
    IDeeplinkFlyoutStyleProps,
    IDeeplinkFlyoutStyles
} from './DeeplinkFlyout.types';

const deeplinkFlyoutClassPrefix = 'cb-deeplinkflyout';

const classNames = {
    root: `${deeplinkFlyoutClassPrefix}-root`,
    button: `${deeplinkFlyoutClassPrefix}-button`,
    callout: `${deeplinkFlyoutClassPrefix}-callout`,
    calloutCheckbox: `${deeplinkFlyoutClassPrefix}-callout-checkbox`,
    calloutTitle: `${deeplinkFlyoutClassPrefix}-callout-title`
};

export const getStyles = (
    props: IDeeplinkFlyoutStyleProps
): IDeeplinkFlyoutStyles => {
    const { theme, isCalloutOpen } = props;
    return {
        /** provide a hook for custom styling by consumers */
        root: [classNames.root, {}],
        /** provide a hook for custom styling by consumers */
        button: [classNames.button, {}],
        /** provide a hook for custom styling by consumers */
        callout: [classNames.callout, {}],
        calloutCheckbox: [classNames.calloutCheckbox, {}],
        calloutTitle: [
            classNames.calloutTitle,
            {
                margin: 0,
                fontSize: FontSizes.size14,
                fontWeight: FontWeights.semibold
            }
        ],
        calloutConfirmationMessage: [
            {
                alignItems: 'center',
                animation: 'fadeIn 0.3s cubic-bezier(0.1, 0.9, 0.2, 1) forwards'
            }
        ],
        subComponentStyles: {
            button: {
                root: {
                    color: `${theme.semanticColors.bodyText} !important`,
                    border: `1px solid ${theme.palette.neutralLight}`,
                    backgroundColor: isCalloutOpen
                        ? theme.semanticColors.buttonBackgroundPressed
                        : theme.semanticColors.buttonBackground
                }
            },
            callout: {
                root: {
                    padding: 16,
                    // backgroundColor: 'var(--cb-color-glassy-modal)',
                    backdropFilter: 'blur(24px) brightness(150%)'
                }
            },
            checkbox: {
                text: {
                    fontSize: FontSizes.size12
                }
            }
        }
    };
};
