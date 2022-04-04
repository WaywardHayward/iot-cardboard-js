import { useMemo } from 'react';
import { ISceneViewWrapperProps } from '../../Models/Constants';
import { I3DScenesConfig } from '../../Models/Types/Generated/3DScenesConfiguration-v1.0.0';

export const useSceneData = (props: {
    mode: 'Builder' | 'Viewer';
    sceneId: string;
    config: I3DScenesConfig;
}): ISceneViewWrapperProps => {
    const { config, mode, sceneId } = props;
    const result: ISceneViewWrapperProps = useMemo(() => {
        const modelUrl =
            config.configuration?.scenes[
                config.configuration?.scenes.findIndex((s) => s.id === sceneId)
            ]?.assets[0].url;

        return {
            sceneViewProps: {
                modelUrl: modelUrl
            }
        };
    }, [config, mode, sceneId]);

    return result;
};
