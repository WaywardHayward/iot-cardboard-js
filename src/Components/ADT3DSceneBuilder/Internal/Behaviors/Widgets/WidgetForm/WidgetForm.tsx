import { DefaultButton, PrimaryButton, useTheme } from '@fluentui/react';
import produce from 'immer';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    WidgetType,
    defaultGaugeWidget,
    defaultLinkWidget,
    VisualType,
    defaultValueWidget
} from '../../../../../../Models/Classes/3DVConfig';
import { WidgetFormMode } from '../../../../../../Models/Constants/Enums';
import {
    IBehavior,
    IGaugeWidget,
    ILinkWidget,
    IPopoverVisual,
    IValueWidget,
    IWidget
} from '../../../../../../Models/Types/Generated/3DScenesConfiguration-v1.0.0';
import { SceneBuilderContext } from '../../../../ADT3DSceneBuilder';
import PanelFooter from '../../../Shared/PanelFooter';
import { getPanelFormStyles } from '../../../Shared/PanelForms.styles';
import { getWidgetFormStyles } from './WidgetForm.styles';
import GaugeWidgetBuilder from '../WidgetBuilders/GaugeWidgetBuilder';
import LinkWidgetBuilder from '../WidgetBuilders/LinkWidgetBuilder';
import { WidgetFormInfo } from '../../../../ADT3DSceneBuilder.types';
import ViewerConfigUtility from '../../../../../../Models/Classes/ViewerConfigUtility';
import ValueWidgetBuilder from '../WidgetBuilders/ValueWidgetBuilder';

const createWidget = (
    draft: IBehavior,
    widgetFormInfo: WidgetFormInfo,
    id: string
) => {
    const popOver = draft.visuals?.find(
        (visual) => visual.type === VisualType.Popover
    ) as IPopoverVisual;

    if (popOver) {
        let widgets = popOver?.widgets;

        const newWidget = {
            ...getDefaultFormData(widgetFormInfo),
            id
        };

        widgets ? widgets.push(newWidget) : (widgets = [newWidget]);
    }
};

const getDefaultFormData = (widgetFormInfo: WidgetFormInfo) => {
    switch (widgetFormInfo.widget.data.type) {
        case WidgetType.Gauge:
            return defaultGaugeWidget;
        case WidgetType.Link:
            return defaultLinkWidget;
        case WidgetType.Value:
            return defaultValueWidget;
        default:
            return null;
    }
};

const getWidgets = (behavior: IBehavior) =>
    behavior.visuals.filter(ViewerConfigUtility.isPopoverVisual)[0].widgets;

const getActiveWidget = (activeWidgetId: string, behavior: IBehavior) =>
    getWidgets(behavior).find((w) => w.id === activeWidgetId);

const WidgetForm: React.FC = () => {
    const {
        widgetFormInfo,
        setWidgetFormInfo,
        behaviorToEdit,
        setBehaviorToEdit
    } = useContext(SceneBuilderContext);

    const [isWidgetConfigValid, setIsWidgetConfigValid] = useState(true);

    const { t } = useTranslation();

    const [activeWidgetId, setActiveWidgetId] = useState(null);

    // On initial render - create or locate widget
    useEffect(() => {
        if (widgetFormInfo.mode === WidgetFormMode.CreateWidget) {
            const newWidgetId = widgetFormInfo.widgetId;
            setBehaviorToEdit(
                produce((draft) => {
                    createWidget(draft, widgetFormInfo, newWidgetId);
                })
            );
            setActiveWidgetId(newWidgetId);
        } else if (widgetFormInfo.mode === WidgetFormMode.EditWidget) {
            setActiveWidgetId(widgetFormInfo.widgetId);
        }
    }, []);

    const updateWidgetData = useCallback(
        (widgetData: IWidget) => {
            if (activeWidgetId) {
                setBehaviorToEdit(
                    produce((draft) => {
                        const widgets = getWidgets(draft);
                        const widgetToUpdateIdx = widgets.findIndex(
                            (w) => w.id === activeWidgetId
                        );
                        widgets[widgetToUpdateIdx] = widgetData;
                    })
                );
            }
        },
        [setBehaviorToEdit, activeWidgetId]
    );

    const getWidgetBuilder = () => {
        const widgetData = getActiveWidget(activeWidgetId, behaviorToEdit);

        switch (widgetFormInfo.widget.data.type) {
            case WidgetType.Gauge:
                return (
                    <GaugeWidgetBuilder
                        formData={widgetData as IGaugeWidget}
                        updateWidgetData={updateWidgetData}
                        setIsWidgetConfigValid={setIsWidgetConfigValid}
                    />
                );
            case WidgetType.Link:
                return (
                    <LinkWidgetBuilder
                        formData={widgetData as ILinkWidget}
                        updateWidgetData={updateWidgetData}
                        setIsWidgetConfigValid={setIsWidgetConfigValid}
                    />
                );
            case WidgetType.Value:
                return (
                    <ValueWidgetBuilder
                        formData={widgetData as IValueWidget}
                        updateWidgetData={updateWidgetData}
                        setIsWidgetConfigValid={setIsWidgetConfigValid}
                    />
                );
            default:
                return (
                    <div className="cb-widget-not-supported">
                        {t('widgets.notSupported')}
                    </div>
                );
        }
    };

    const theme = useTheme();
    const customStyles = getWidgetFormStyles(theme);
    const commonFormStyles = getPanelFormStyles(theme, 0);

    if (!getActiveWidget(activeWidgetId, behaviorToEdit)) return null;
    return (
        <>
            <div className={commonFormStyles.content}>
                <div className={commonFormStyles.header}>
                    <div className={customStyles.description}>
                        {widgetFormInfo.widget.description}
                    </div>
                </div>
                {getWidgetBuilder()}
            </div>
            <PanelFooter>
                <PrimaryButton
                    data-testid={'widget-form-primary-button'}
                    onClick={() =>
                        setWidgetFormInfo({ mode: WidgetFormMode.Committed })
                    }
                    text={
                        widgetFormInfo.mode === WidgetFormMode.CreateWidget
                            ? t('3dSceneBuilder.createWidget')
                            : t('3dSceneBuilder.updateWidget')
                    }
                    disabled={!isWidgetConfigValid}
                />
                <DefaultButton
                    data-testid={'widget-form-secondary-button'}
                    text={t('cancel')}
                    onClick={() => {
                        setWidgetFormInfo({ mode: WidgetFormMode.Cancelled });
                    }}
                />
            </PanelFooter>
        </>
    );
};

export default WidgetForm;