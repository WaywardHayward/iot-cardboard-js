import React, { useReducer, useEffect } from 'react';
import OATHeader from '../../Components/OATHeader/OATHeader';
import OATModelList from '../../Components/OATModelList/OATModelList';
import OATGraphViewer from '../../Components/OATGraphViewer/OATGraphViewer';
import OATPropertyEditor from '../../Components/OATPropertyEditor/OATPropertyEditor';
import OATImport from './Internal/OATImport';
import { getEditorPageStyles } from './OATEditorPage.Styles';
import {
    OATEditorPageReducer,
    defaultOATEditorState
} from './OATEditorPage.state';
import { SET_OAT_IS_JSON_UPLOADER_OPEN } from '../../Models/Constants/ActionTypes';
import i18n from '../../i18n';
import {
    loadFiles,
    saveFiles
} from '../../Components/OATHeader/internal/Utils';
import { OATDataStorageKey } from '../../Models/Constants';

const OATEditorPage = ({ theme }) => {
    const [state, dispatch] = useReducer(
        OATEditorPageReducer,
        defaultOATEditorState
    );
    const { graphViewerPositions, projectName, graphViewerElements } = state;
    const EditorPageStyles = getEditorPageStyles();

    const languages = Object.keys(i18n.options.resources).map((language) => {
        return {
            key: i18n.options.resources[language].translation.languageCode,
            text: i18n.options.resources[language].translation.languageName
        };
    });

    const handleImportClick = () => {
        dispatch({
            type: SET_OAT_IS_JSON_UPLOADER_OPEN,
            payload: !state.isJsonUploaderOpen
        });
    };

    const getStoredElements = () => {
        const editorData = JSON.parse(localStorage.getItem(OATDataStorageKey));
        return editorData && editorData.models ? editorData.models : null;
    };

    useEffect(() => {
        // Update storage
        console.log('Updating storage');
        const editorData = JSON.parse(localStorage.getItem(OATDataStorageKey));
        const oatEditorData = {
            ...editorData,
            models: graphViewerElements,
            modelPositions: graphViewerPositions,
            projectName: projectName,
            projectDescription: 'project description'
        };

        localStorage.setItem(OATDataStorageKey, JSON.stringify(oatEditorData));
    }, [graphViewerPositions, projectName, graphViewerElements]);

    useEffect(() => {
        //  Set the OATFilesStorageKey to the localStorage
        const files = loadFiles();
        if (!files) {
            saveFiles([]);
        }
    }, []);

    return (
        <div className={EditorPageStyles.container}>
            <OATHeader
                elements={state.elements.digitalTwinsModels}
                onImportClick={handleImportClick}
                state={state}
                dispatch={dispatch}
            />
            <OATImport
                isJsonUploaderOpen={state.isJsonUploaderOpen}
                dispatch={dispatch}
            />
            <div
                className={
                    state.templatesActive
                        ? EditorPageStyles.componentTemplate
                        : EditorPageStyles.component
                }
            >
                <OATModelList
                    elements={state.elements.digitalTwinsModels}
                    dispatch={dispatch}
                />
                <OATGraphViewer
                    state={state}
                    dispatch={dispatch}
                    storedElements={getStoredElements()}
                />
                <OATPropertyEditor
                    theme={theme}
                    state={state}
                    dispatch={dispatch}
                    languages={languages}
                />
            </div>
        </div>
    );
};

export default React.memo(OATEditorPage);
