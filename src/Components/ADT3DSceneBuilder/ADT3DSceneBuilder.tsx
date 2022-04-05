import {
    ContextualMenu,
    ContextualMenuItemType,
    mergeStyleSets,
    useTheme
} from '@fluentui/react';
import React, {
    useCallback,
    useEffect,
    useReducer,
    useRef,
    useState
} from 'react';
import { ADT3DSceneBuilderMode } from '../../Models/Constants/Enums';
import ADT3DBuilder from '../ADT3DBuilder/ADT3DBuilder';
import {
    I3DSceneBuilderContext,
    IADT3DSceneBuilderCardProps,
    IContextMenuProps,
    SET_ADT_SCENE_BUILDER_MODE,
    SET_ADT_SCENE_BUILDER_SELECTED_BEHAVIOR,
    SET_ADT_SCENE_BUILDER_SELECTED_ELEMENT,
    SET_ADT_SCENE_CONFIG,
    SET_ADT_SCENE_ELEMENT_SELECTED_OBJECT_IDS,
    SET_ADT_SCENE_OBJECT_COLOR,
    SET_MESH_IDS_TO_OUTLINE,
    SET_REVERT_TO_HOVER_COLOR,
    SET_WIDGET_FORM_INFO,
    WidgetFormInfo
} from './ADT3DSceneBuilder.types';
import './ADT3DSceneBuilder.scss';
import BaseComponent from '../../Components/BaseComponent/BaseComponent';
import useAdapter from '../../Models/Hooks/useAdapter';
import {
    ADT3DSceneBuilderReducer,
    defaultADT3DSceneBuilderState
} from './ADT3DSceneBuilder.state';
import { IADTAdapter } from '../../Models/Constants/Interfaces';
import BuilderLeftPanel from './Internal/BuilderLeftPanel';
import { useTranslation } from 'react-i18next';
import { AbstractMesh } from 'babylonjs/Meshes/abstractMesh';
import { CustomMeshItem, Marker } from '../../Models/Classes/SceneView.types';
import {
    I3DScenesConfig,
    IBehavior,
    ITwinToObjectMapping
} from '../../Models/Types/Generated/3DScenesConfiguration-v1.0.0';
import { createCustomMeshItems } from '../3DV/SceneView.Utils';
import ViewerConfigUtility from '../../Models/Classes/ViewerConfigUtility';
import { createGUID, deepCopy } from '../../Models/Services/Utils';
import {
    DatasourceType,
    defaultBehavior
} from '../../Models/Classes/3DVConfig';
import { IADTObjectColor } from '../../Models/Constants';
import { SceneViewWrapper } from '../3DV/SceneViewWrapper';
import { Scene } from 'babylonjs';
import { useSceneData } from './useSceneViewer';

const contextMenuStyles = mergeStyleSets({
    header: {
        marginLeft: -25,
        marginTop: -4,
        marginBottom: -4
    }
});

export const SceneBuilderContext = React.createContext<I3DSceneBuilderContext>(
    null
);

const ADT3DSceneBuilder: React.FC<IADT3DSceneBuilderCardProps> = ({
    sceneId,
    adapter,
    theme,
    locale,
    localeStrings
}) => {
    const { t } = useTranslation();
    const fluentTheme = useTheme();
    const [state, dispatch] = useReducer(
        ADT3DSceneBuilderReducer,
        defaultADT3DSceneBuilderState
    );

    const previouslyColoredMeshItems = useRef([]);
    const elementContextualMenuItems = useRef([]);
    const behaviorContextualMenuItems = useRef([]);

    const [
        contextualMenuProps,
        setContextualMenuProps
    ] = useState<IContextMenuProps>({
        isVisible: false,
        x: 0,
        y: 0,
        items: elementContextualMenuItems.current
    });

    useEffect(() => {
        elementContextualMenuItems.current = [
            {
                key: t('3dSceneBuilder.elementActions'),
                itemType: ContextualMenuItemType.Header,
                text: t('3dSceneBuilder.elementActions'),
                className: contextMenuStyles.header
            },
            {
                key: t('3dSceneBuilder.elements'),
                itemType: ContextualMenuItemType.Section,
                sectionProps: {
                    topDivider: true,
                    bottomDivider: false,
                    items: []
                }
            },
            {
                key: t('3dSceneBuilder.actions'),
                itemType: ContextualMenuItemType.Section,
                sectionProps: {
                    topDivider: true,
                    bottomDivider: false,
                    items: [
                        {
                            key: t('3dSceneBuilder.createNewElementKey'),
                            text: t('3dSceneBuilder.createNewElement'),
                            iconProps: {
                                iconName: 'Add',
                                style: {
                                    fontSize: '14px',
                                    color: fluentTheme.semanticColors.bodyText
                                }
                            },
                            onClick: () => {
                                elementContextualMenuItems.current[1].sectionProps.items = [];
                                dispatch({
                                    type: SET_ADT_SCENE_BUILDER_MODE,
                                    payload: ADT3DSceneBuilderMode.CreateElement
                                });
                            }
                        }
                    ]
                }
            }
        ];

        behaviorContextualMenuItems.current = [
            {
                key: t('3dSceneBuilder.behaviorActions'),
                itemType: ContextualMenuItemType.Header,
                text: t('3dSceneBuilder.behaviorActions'),
                className: contextMenuStyles.header
            },
            {
                key: t('3dSceneBuilder.behaviors'),
                itemType: ContextualMenuItemType.Section,
                sectionProps: {
                    topDivider: true,
                    bottomDivider: false,
                    items: []
                }
            },
            {
                key: t('3dSceneBuilder.actions'),
                itemType: ContextualMenuItemType.Section,
                sectionProps: {
                    topDivider: true,
                    bottomDivider: false,
                    items: []
                }
            }
        ];
    }, []);

    useEffect(() => {
        if (state.builderMode === ADT3DSceneBuilderMode.ElementsIdle) {
            dispatch({
                type: SET_REVERT_TO_HOVER_COLOR,
                payload: false
            });
        } else {
            dispatch({
                type: SET_REVERT_TO_HOVER_COLOR,
                payload: true
            });
        }
    }, [state.builderMode]);

    const setColoredMeshItems = (coloredMeshItems: Array<CustomMeshItem>) => {
        dispatch({
            type: SET_ADT_SCENE_ELEMENT_SELECTED_OBJECT_IDS,
            payload: coloredMeshItems
        });
    };

    const setOutlinedMeshItems = (outlinedMeshItems: Array<CustomMeshItem>) => {
        dispatch({
            type: SET_MESH_IDS_TO_OUTLINE,
            payload: outlinedMeshItems
        });
    };

    const setWidgetFormInfo = (widgetFormInfo: WidgetFormInfo) => {
        dispatch({
            type: SET_WIDGET_FORM_INFO,
            payload: widgetFormInfo
        });
    };

    const getScenesConfig = useAdapter({
        adapterMethod: () => adapter.getScenesConfig(),
        refetchDependencies: [adapter]
    });

    useEffect(() => {
        if (!getScenesConfig.adapterResult.hasNoData()) {
            const config: I3DScenesConfig = getScenesConfig.adapterResult.getData();
            dispatch({
                type: SET_ADT_SCENE_CONFIG,
                payload: config
            });
        } else {
            dispatch({
                type: SET_ADT_SCENE_CONFIG,
                payload: null
            });
        }
    }, [getScenesConfig?.adapterResult]);

    const onMeshHovered = (mesh: AbstractMesh) => {
        switch (state.builderMode) {
            case ADT3DSceneBuilderMode.ElementsIdle:
                meshHoverOnElementsIdle(mesh);
                break;
            case ADT3DSceneBuilderMode.BehaviorIdle:
                meshHoverOnBehaviorsIdle(mesh);
                break;
        }
    };

    const meshHoverOnBehaviorsIdle = (mesh: AbstractMesh) => {
        const meshIds = [];
        if (!contextualMenuProps.isVisible) {
            if (mesh) {
                for (const element of state.elements) {
                    // find elements that contain this mesh
                    if (element.objectIDs.includes(mesh.id)) {
                        for (const id of element.objectIDs) {
                            // add meshes that make up element to highlight
                            meshIds.push(id);
                        }
                    }
                }
                setOutlinedMeshItems(
                    createCustomMeshItems(
                        meshIds,
                        state.objectColor.outlinedMeshHoverColor
                    )
                );
            } else {
                setOutlinedMeshItems([]);
            }
        }
    };

    const meshHoverOnElementsIdle = (mesh: AbstractMesh) => {
        let coloredMeshes = [];
        const meshIds = [];
        if (mesh && !contextualMenuProps.isVisible) {
            if (state?.elements?.length > 0) {
                for (const element of state.elements) {
                    // find elements that contain this mesh
                    if (element.objectIDs.includes(mesh.id)) {
                        for (const id of element.objectIDs) {
                            // set mesh color for mesh that is hovered
                            if (id === mesh.id) {
                                coloredMeshes.push({
                                    meshId: id,
                                    color: state.objectColor.meshHoverColor
                                });
                            }
                            // add all element meshes to highlight
                            meshIds.push(id);
                        }
                    } else {
                        // if mesh is not in an element just color it
                        coloredMeshes.push({
                            meshId: mesh.id,
                            color: state.objectColor.meshHoverColor
                        });
                    }
                }
            } else {
                coloredMeshes.push({
                    meshId: mesh.id,
                    color: state.objectColor.meshHoverColor
                });
            }
        } else if (contextualMenuProps.isVisible) {
            coloredMeshes = previouslyColoredMeshItems.current;
        }

        setOutlinedMeshItems(
            createCustomMeshItems(
                meshIds,
                state.objectColor.outlinedMeshHoverColor
            )
        );
        setColoredMeshItems(coloredMeshes);
    };

    const objectColorUpdated = (objectColor: IADTObjectColor) => {
        dispatch({
            type: SET_ADT_SCENE_OBJECT_COLOR,
            payload: objectColor
        });
    };

    const mode: 'Builder' | 'Viewer' = 'Builder';
    const sceneViewWrapperProps = useSceneData({
        mode: mode,
        config: state.config,
        sceneId: sceneId
    });

    return (
        <SceneBuilderContext.Provider
            value={{
                adapter,
                theme,
                locale,
                localeStrings,
                coloredMeshItems: state.coloredMeshItems,
                setColoredMeshItems,
                setOutlinedMeshItems,
                config: state.config,
                getConfig: getScenesConfig.callAdapter,
                sceneId,
                widgetFormInfo: state.widgetFormInfo,
                setWidgetFormInfo,
                dispatch,
                state,
                objectColor: state.objectColor
            }}
        >
            <BaseComponent
                isLoading={!state.config && getScenesConfig.isLoading}
                theme={theme}
                locale={locale}
                localeStrings={localeStrings}
                containerClassName="cb-scene-builder-card-wrapper"
            >
                {mode === 'Builder' && state.config && <BuilderLeftPanel />}
                {mode === 'Viewer' && <ElementsPanel />}
                {mode === 'Viewer' && <Popover />}
                <SceneViewWrapper
                    {...sceneViewWrapperProps}
                    objectColorUpdated={objectColorUpdated}
                    // hideViewModePickerUI={hideViewModePickerUI}
                    sceneViewProps={{
                        // modelUrl:
                        //     state.config.configuration?.scenes[
                        //         state.config.configuration?.scenes.findIndex(
                        //             (s) => s.id === sceneId
                        //         )
                        //     ]?.assets[0].url,
                        onMeshClick: (
                            _marker: Marker,
                            mesh: AbstractMesh,
                            _scene: Scene,
                            e: PointerEvent
                        ) => onMeshClicked(mesh, e),
                        onMeshHover: (
                            _marker: Marker,
                            mesh: AbstractMesh,
                            _scene: Scene,
                            _e: PointerEvent
                        ) => onMeshHovered(mesh),
                        coloredMeshItems: state.coloredMeshItems,
                        showMeshesOnHover: state.enableHoverOnModel ?? true,
                        showHoverOnSelected: state.showHoverOnSelected,
                        outlinedMeshitems: state.outlinedMeshItems,
                        getToken: (adapter as any).authService
                            ? () =>
                                  (adapter as any).authService.getToken(
                                      'storage'
                                  )
                            : undefined
                    }}
                />
                {/* <div className="cb-scene-builder-canvas"> */}
                {mode === 'Builder' && state.config && (
                    <>
                        {/* <ADT3DBuilder
                                objectColorUpdated={objectColorUpdated}
                                adapter={adapter as IADTAdapter}
                                modelUrl={
                                   
                                }
                                onMeshClicked={onMeshClicked}
                                onMeshHovered={onMeshHovered}
                                outlinedMeshItems={state.outlinedMeshItems}
                                showHoverOnSelected={state.showHoverOnSelected}
                                coloredMeshItems={state.coloredMeshItems}
                                showMeshesOnHover={state.enableHoverOnModel}
                            /> */}
                    </>
                )}
                {/* </div> */}
                {mode === 'Viewer' && (
                    <SceneViewWrapper
                        {...sceneViewWrapperProps}
                        adapter={adapter}
                        config={state.config}
                        sceneId={sceneId}
                        sceneVisuals={sceneVisuals}
                        addInProps={addInProps}
                        hideViewModePickerUI={hideViewModePickerUI}
                        sceneViewProps={{
                            badgeGroups: alertBadges,
                            modelUrl: modelUrl,
                            coloredMeshItems: coloredMeshItems,
                            outlinedMeshitems: outlinedMeshItems,
                            showHoverOnSelected: showHoverOnSelected,
                            showMeshesOnHover: showMeshesOnHover,
                            zoomToMeshIds: zoomToMeshIds,
                            unzoomedMeshOpacity: unzoomedMeshOpacity,
                            onMeshClick: (marker, mesh, scene) =>
                                meshClick(marker, mesh, scene),
                            onMeshHover: (marker, mesh) =>
                                meshHover(marker, mesh),
                            getToken: (adapter as any).authService
                                ? () =>
                                      (adapter as any).authService.getToken(
                                          'storage'
                                      )
                                : undefined
                        }}
                    />
                )}

                {contextualMenuProps.isVisible && (
                    <div>
                        <div
                            id="cb-3d-builder-contextual-menu"
                            style={{
                                left: contextualMenuProps.x,
                                top: contextualMenuProps.y,
                                position: 'absolute',
                                width: '1px',
                                height: '1px'
                            }}
                        />
                        <ContextualMenu
                            items={contextualMenuProps.items}
                            hidden={!contextualMenuProps.isVisible}
                            target="#cb-3d-builder-contextual-menu"
                            onDismiss={() =>
                                setContextualMenuProps({
                                    isVisible: false,
                                    x: 0,
                                    y: 0,
                                    items: []
                                })
                            }
                        />
                    </div>
                )}
            </BaseComponent>
        </SceneBuilderContext.Provider>
    );
};
export default React.memo(ADT3DSceneBuilder);
