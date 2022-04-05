import { AbstractMesh, Scene } from 'babylonjs';
import { useCallback, useMemo } from 'react';
import { Marker } from '../../Models/Classes/SceneView.types';
import { ISceneViewWrapperProps } from '../../Models/Constants';
import { I3DScenesConfig } from '../../Models/Types/Generated/3DScenesConfiguration-v1.0.0';

export const useSceneData = (props: {
    mode: 'Builder' | 'Viewer';
    sceneId: string;
    config: I3DScenesConfig;
}): ISceneViewWrapperProps => {
    const { config, mode, sceneId } = props;
    const modelUrl = useMemo(
        () =>
            config.configuration?.scenes[
                config.configuration?.scenes.findIndex((s) => s.id === sceneId)
            ]?.assets[0].url,
        [config, sceneId]
    );
    const onMeshClick = useCallback(
        (_marker: Marker, mesh: AbstractMesh, _scene: Scene, e: PointerEvent) =>
            onMeshClicked(mesh, e),
        [onMeshClick]
    );

    const result: ISceneViewWrapperProps =
        // useMemo(() =>
        {
            sceneViewProps: {
                modelUrl: modelUrl
            }
        };
    // }, [mode, modelUrl]);

    return result;
};
