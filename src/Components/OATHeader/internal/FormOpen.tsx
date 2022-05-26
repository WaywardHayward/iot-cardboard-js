import React, { useState } from 'react';
import {
    Text,
    ActionButton,
    FontIcon,
    PrimaryButton,
    Stack,
    Dropdown
} from '@fluentui/react';
import { useTranslation } from 'react-i18next';
import { IAction } from '../../../Models/Constants/Interfaces';
import { OATDataStorageKey } from '../../../Models/Constants';
import { SET_OAT_PROJECT } from '../../../Models/Constants/ActionTypes';
import { getHeaderStyles } from '../OATHeader.styles';
import { loadFiles } from './Utils';

interface IModal {
    dispatch?: React.Dispatch<React.SetStateAction<IAction>>;
    setModalBody?: React.Dispatch<React.SetStateAction<string>>;
    setModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FormOpen = ({ dispatch, setModalOpen, setModalBody }: IModal) => {
    const { t } = useTranslation();
    const headerStyles = getHeaderStyles();
    const [selectedFile, setSelectedFile] = useState(null);

    const handleOpen = () => {
        dispatch({
            type: SET_OAT_PROJECT,
            payload: {
                projectName: selectedFile.text,
                elements: selectedFile.key.models,
                positions: selectedFile.key.modelPositions
            }
        });

        setModalOpen(false);
        setModalBody('');
    };

    const getFormatFilesToDropDownOptions = () => {
        const storedFiles = loadFiles();
        if (storedFiles.length > 0) {
            const formattedFiles = storedFiles.map((file) => {
                return {
                    key: file.data,
                    text: file.name
                };
            });

            return formattedFiles;
        }
    };

    return (
        <Stack>
            <div className={headerStyles.modalRowFlexEnd}>
                <ActionButton onClick={() => setModalOpen(false)}>
                    <FontIcon iconName={'ChromeClose'} />
                </ActionButton>
            </div>

            <div className={headerStyles.modalRow}>
                <Text>Select file:</Text>
                <Dropdown
                    placeholder="Files"
                    options={getFormatFilesToDropDownOptions()}
                    onChange={(_ev, option) => setSelectedFile(option)}
                />
            </div>

            <div className={headerStyles.modalRowFlexEnd}>
                <PrimaryButton
                    text={t('OATHeader.open')}
                    onClick={handleOpen}
                    disabled={!selectedFile}
                />

                <PrimaryButton
                    text={t('OATHeader.cancel')}
                    onClick={() => setModalOpen(false)}
                />
            </div>
        </Stack>
    );
};

export default FormOpen;
