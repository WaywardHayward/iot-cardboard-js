import {
    IContextualMenuItem,
    memoizeFunction,
    useTheme,
    Theme,
    FontSizes
} from '@fluentui/react';
import { AbstractMesh } from 'babylonjs';
import {
    MutableRefObject,
    SetStateAction,
    useCallback,
    useReducer,
    useRef,
    useState
} from 'react';
import { TFunction, useTranslation } from 'react-i18next';
import {
    defaultBehavior,
    DatasourceType
} from '../../Models/Classes/3DVConfig';
import { CustomMeshItem } from '../../Models/Classes/SceneView.types';
import ViewerConfigUtility from '../../Models/Classes/ViewerConfigUtility';
import { ADT3DSceneBuilderMode, IADTObjectColor } from '../../Models/Constants';
import { deepCopy, createGUID } from '../../Models/Services/Utils';
import {
    IBehavior,
    ITwinToObjectMapping
} from '../../Models/Types/Generated/3DScenesConfiguration-v1.0.0';
import { createCustomMeshItems } from '../3DV/SceneView.Utils';
import {
    ADT3DSceneBuilderReducer,
    defaultADT3DSceneBuilderState
} from './ADT3DSceneBuilder.state';
import {
    SET_ADT_SCENE_BUILDER_SELECTED_BEHAVIOR,
    SET_ADT_SCENE_BUILDER_MODE,
    SET_ADT_SCENE_BUILDER_SELECTED_ELEMENT,
    SET_MESH_IDS_TO_OUTLINE,
    IContextMenuProps
} from './ADT3DSceneBuilder.types';

interface IMeshHandler {
    onMeshClicked: (mesh: AbstractMesh, e: PointerEvent) => void;
    contextMenuProps: IContextMenuProps;
}
export const useMeshHandlers = (
    builderMode: ADT3DSceneBuilderMode,
    coloredMeshItems: CustomMeshItem[],
    setColoredMeshItems: (items: CustomMeshItem[]) => void
): IMeshHandler => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [state, dispatch] = useReducer(
        ADT3DSceneBuilderReducer,
        defaultADT3DSceneBuilderState
    );
    const previouslyColoredMeshItems = useRef<CustomMeshItem[]>([]);
    const elementContextualMenuItems = useRef<IContextualMenuItem[]>([]);
    const behaviorContextualMenuItems = useRef<IContextualMenuItem[]>([]);
    const [
        contextualMenuProps,
        setContextualMenuProps
    ] = useState<IContextMenuProps>({
        isVisible: false,
        x: 0,
        y: 0,
        items: elementContextualMenuItems.current
    });

    const setOutlinedMeshItems = (outlinedMeshItems: Array<CustomMeshItem>) => {
        dispatch({
            type: SET_MESH_IDS_TO_OUTLINE,
            payload: outlinedMeshItems
        });
    };

    const setSelectedBuilderBehavior = (behavior: IBehavior) => {
        dispatch({
            type: SET_ADT_SCENE_BUILDER_SELECTED_BEHAVIOR,
            payload: behavior
        });
    };
    const setBuilderMode = (mode: ADT3DSceneBuilderMode) => {
        dispatch({
            type: SET_ADT_SCENE_BUILDER_MODE,
            payload: mode
        });
    };

    const addContextualMenuItems = (
        item: IContextualMenuItem,
        targetMenu: IContextualMenuItem
    ) => {
        if (!targetMenu.sectionProps.items.find((ci) => ci.key === item.key)) {
            targetMenu.sectionProps.items.push(item);
        }
    };

    const meshClickOnBehaviorsIdle = getMeshClickOnBehaviorsIdle(
        behaviorContextualMenuItems,
        previouslyColoredMeshItems,
        state.elements,
        state.config?.configuration?.behaviors,
        state.objectColor,
        theme,
        addContextualMenuItems,
        setOutlinedMeshItems,
        setBuilderMode,
        setContextualMenuProps,
        setSelectedBuilderBehavior,
        t
    );

    const meshClickOnElementsIdle = (mesh: AbstractMesh, e: PointerEvent) => {
        elementContextualMenuItems.current[1].sectionProps.items = [];
        // find elements which contian the clicked mesh
        for (const element of state.elements) {
            if (element.objectIDs.includes(mesh.id)) {
                // create context menu items for each element
                const item: IContextualMenuItem = {
                    key: element.id,
                    text: t('3dSceneBuilder.edit', {
                        elementDisplayName: element.displayName
                    }),
                    iconProps: {
                        iconName: 'Edit',
                        style: {
                            fontSize: FontSizes.size14,
                            color: theme.semanticColors.bodyText
                        }
                    },
                    onClick: () => {
                        elementContextualMenuItems.current[1].sectionProps.items = [];
                        dispatch({
                            type: SET_ADT_SCENE_BUILDER_SELECTED_ELEMENT,
                            payload: element
                        });
                        dispatch({
                            type: SET_ADT_SCENE_BUILDER_MODE,
                            payload: ADT3DSceneBuilderMode.EditElement
                        });
                    },
                    onMouseOver: () => {
                        // highlight the hovered element
                        setOutlinedMeshItems(
                            createCustomMeshItems(
                                element.objectIDs,
                                state.objectColor.outlinedMeshHoverColor
                            )
                        );
                    },
                    onMouseOut: () => {
                        setOutlinedMeshItems([]);
                        setColoredMeshItems(previouslyColoredMeshItems.current);
                    }
                };

                // add edit element items to the context menu in the correct position
                addContextualMenuItems(
                    item,
                    elementContextualMenuItems.current[1]
                );
            }
        }

        // colored the selected mesh
        const coloredMesh: CustomMeshItem = { meshId: mesh.id, color: null };
        setColoredMeshItems([coloredMesh]);
        setOutlinedMeshItems([]);
        previouslyColoredMeshItems.current = [coloredMesh];

        setContextualMenuProps({
            isVisible: true,
            x: e.clientX,
            y: e.clientY,
            items: elementContextualMenuItems.current
        });
    };

    const meshClickOnEditElement = (mesh: AbstractMesh) => {
        const selectedMesh = coloredMeshItems.find(
            (item) => item.meshId === mesh.id
        );
        let coloredMeshes = [...coloredMeshItems];

        if (selectedMesh) {
            coloredMeshes = coloredMeshItems.filter(
                (item) => item.meshId !== selectedMesh.meshId
            );
        } else {
            coloredMeshes.push({ meshId: mesh.id });
        }
        setColoredMeshItems(coloredMeshes);
    };

    const onMeshClicked = useCallback(
        (mesh: AbstractMesh, e: PointerEvent) => {
            if (mesh) {
                switch (builderMode) {
                    case ADT3DSceneBuilderMode.ElementsIdle:
                        meshClickOnElementsIdle(mesh, e);
                        break;

                    case ADT3DSceneBuilderMode.EditElement:
                    case ADT3DSceneBuilderMode.CreateElement:
                        meshClickOnEditElement(mesh);
                        break;

                    case ADT3DSceneBuilderMode.BehaviorIdle:
                        meshClickOnBehaviorsIdle(mesh, e);
                        break;
                }
            } else {
                elementContextualMenuItems.current[1].sectionProps.items = [];
                if (
                    state.builderMode === ADT3DSceneBuilderMode.ElementsIdle ||
                    state.builderMode === ADT3DSceneBuilderMode.BehaviorIdle
                ) {
                    setColoredMeshItems([]);
                    setOutlinedMeshItems([]);
                }
            }
        },
        [state]
    );

    return {
        onMeshClicked: onMeshClicked,
        contextMenuProps: contextualMenuProps
    };
};

const getMeshClickOnBehaviorsIdle = memoizeFunction(
    (
        behaviorContextualMenuItems: MutableRefObject<IContextualMenuItem[]>,
        previouslyColoredMeshItems: MutableRefObject<CustomMeshItem[]>,
        stateElements: ITwinToObjectMapping[],
        stateBehaviors: IBehavior[] | undefined,
        objectColor: IADTObjectColor,
        theme: Theme,
        addContextualMenuItems: (
            item: IContextualMenuItem,
            targetMenu: IContextualMenuItem
        ) => void,
        setOutlinedMeshItems: (
            outlinedMeshItems: Array<CustomMeshItem>
        ) => void,
        setBuilderMode: (mode: ADT3DSceneBuilderMode) => void,
        setContextualMenuProps: (
            value: SetStateAction<IContextMenuProps>
        ) => void,
        setSelectedBuilderBehavior: (behavior: IBehavior) => void,
        t: TFunction<string>
    ) => (mesh: AbstractMesh, e: PointerEvent) => {
        let outlinedElements = [];
        const elements: ITwinToObjectMapping[] = [];
        // clear context menu
        behaviorContextualMenuItems.current[1].sectionProps.items = [];
        behaviorContextualMenuItems.current[2].sectionProps.items = [];
        for (const element of stateElements) {
            // find elements that contain this mesh
            if (element.objectIDs.includes(mesh.id)) {
                elements.push(element);
                // color any meshes that are in the elements
                outlinedElements = outlinedElements.concat(
                    createCustomMeshItems(
                        element.objectIDs,
                        objectColor.outlinedMeshSelectedColor
                    )
                );
            }
        }

        if (outlinedElements.length > 0) {
            setOutlinedMeshItems(outlinedElements);
            previouslyColoredMeshItems.current = outlinedElements;
        } else {
            setOutlinedMeshItems([]);
        }

        let behaviors: IBehavior[] = [];
        // get behaviors that contain any of the elements
        for (const element of elements) {
            const behavior = ViewerConfigUtility.getBehaviorsOnElement(
                element,
                stateBehaviors
            );
            if (behavior) {
                behaviors = behaviors.concat(behavior);
            }
        }

        // create edit behavior items for the context menu
        for (const behavior of behaviors) {
            const item: IContextualMenuItem = {
                key: behavior.id,
                text: t('3dSceneBuilder.edit', {
                    elementDisplayName: behavior.displayName
                }),
                iconProps: {
                    iconName: 'Edit',
                    style: {
                        fontSize: FontSizes.size14,
                        color: theme.semanticColors.bodyText
                    }
                },
                onClick: () => {
                    behaviorContextualMenuItems.current[1].sectionProps.items = [];
                    behaviorContextualMenuItems.current[2].sectionProps.items = [];
                    setSelectedBuilderBehavior(behavior);
                    setBuilderMode(ADT3DSceneBuilderMode.EditBehavior);
                },
                onMouseOver: () => {
                    // get elements that are contained in the hovered behavior
                    let ids = [];
                    const selectedElements = [];
                    behavior.datasources
                        .filter(
                            ViewerConfigUtility.isElementTwinToObjectMappingDataSource
                        )
                        .forEach((ds) => {
                            ds.elementIDs.forEach((elementId) => {
                                const element = stateElements.find(
                                    (el) => el.id === elementId
                                );
                                element && selectedElements.push(element);
                            });
                        });

                    for (const element of selectedElements) {
                        ids = ids.concat(element.objectIDs);
                    }

                    // colored meshes that are in the elements contained in the hovered behavior
                    setOutlinedMeshItems(
                        createCustomMeshItems(
                            ids,
                            objectColor.outlinedMeshHoverColor
                        )
                    );
                },
                onMouseOut: () => {
                    // rest highlight and mesh colorings
                    setOutlinedMeshItems(previouslyColoredMeshItems.current);
                }
            };

            // add edit behavior context menu items to the correct section
            addContextualMenuItems(
                item,
                behaviorContextualMenuItems.current[1]
            );
        }

        // loop through elements that contain the clicked mesh to create context menu items
        for (const element of elements) {
            const item: IContextualMenuItem = {
                key: element.id,
                text: t('3dSceneBuilder.createWithElement', {
                    element: element.displayName
                }),
                iconProps: {
                    iconName: 'Add',
                    style: {
                        fontSize: '14px',
                        color: theme.semanticColors.bodyText
                    }
                },
                onClick: () => {
                    behaviorContextualMenuItems.current[1].sectionProps.items = [];
                    behaviorContextualMenuItems.current[2].sectionProps.items = [];
                    setOutlinedMeshItems([]);
                    // create new behavior and set data scource to the selected element (need to clone if not the defualt behavior in
                    // memory is updated which causes bugs when creating new behaviors)
                    const newBehavior: IBehavior = {
                        ...deepCopy(defaultBehavior),
                        id: createGUID()
                    };
                    newBehavior.datasources[0] = {
                        type:
                            DatasourceType.ElementTwinToObjectMappingDataSource,
                        elementIDs: [element.id]
                    };
                    setSelectedBuilderBehavior(newBehavior);
                    setBuilderMode(ADT3DSceneBuilderMode.CreateBehavior);
                },
                onMouseOver: () => {
                    // highlight the hovered element
                    setOutlinedMeshItems(
                        createCustomMeshItems(
                            element.objectIDs,
                            objectColor.outlinedMeshHoverColor
                        )
                    );
                },
                onMouseOut: () => {
                    setOutlinedMeshItems(previouslyColoredMeshItems.current);
                }
            };

            // add create new behavior items to the context menu in the correct position
            addContextualMenuItems(
                item,
                behaviorContextualMenuItems.current[2]
            );
        }

        // only show the context menu on click if an element has been clicked
        if (elements.length > 0) {
            setContextualMenuProps({
                isVisible: true,
                x: e.clientX,
                y: e.clientY,
                items: behaviorContextualMenuItems.current
            });
        }
    }
);
