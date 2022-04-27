import React from 'react';
import {
    TextField,
    Stack,
    Text,
    ActionButton,
    FontIcon
} from '@fluentui/react';
import { getPropertyInspectorStyles } from './OATPropertyEditor.styles';
import { DTDLModel, DTDLSchemaType } from '../../Models/Classes/DTDL';
import AddPropertyBar from './AddPropertyBar';
import PropertyListItemNested from './PropertyListItemNested';
import PropertyListEnumItemNested from './PropertyListEnumItemNested';
import PropertyListMapItemNested from './PropertyListMapItemNested';
import { deepCopy } from '../../Models/Services/Utils';

type IPropertyListItem = {
    deleteItem?: (index: number) => any;
    draggingProperty?: boolean;
    getItemClassName?: (index: number) => any;
    getNestedItemClassName?: () => any;
    getErrorMessage?: (value: string) => string;
    handleDragEnter?: (event: any, item: any) => any;
    handleDragEnterExternalItem?: (index: number) => any;
    handleDragStart?: (event: any, item: any) => any;
    index?: number;
    item?: any;
    lastPropertyFocused?: any;
    model?: DTDLModel;
    setCurrentNestedPropertyIndex?: React.Dispatch<
        React.SetStateAction<number>
    >;
    setCurrentPropertyIndex?: React.Dispatch<React.SetStateAction<number>>;
    setLastPropertyFocused?: React.Dispatch<React.SetStateAction<any>>;
    setModalBody?: React.Dispatch<React.SetStateAction<string>>;
    setModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    setModel?: React.Dispatch<React.SetStateAction<DTDLModel>>;
    setPropertySelectorVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

export const PropertyListItemNest = ({
    index,
    deleteItem,
    draggingProperty,
    getItemClassName,
    getNestedItemClassName,
    getErrorMessage,
    handleDragEnter,
    handleDragEnterExternalItem,
    handleDragStart,
    setCurrentPropertyIndex,
    item,
    lastPropertyFocused,
    setLastPropertyFocused,
    setPropertySelectorVisible,
    setCurrentNestedPropertyIndex,
    setModalOpen,
    setModalBody,
    model,
    setModel
}: IPropertyListItem) => {
    const propertyInspectorStyles = getPropertyInspectorStyles();

    const addPropertyCallback = () => {
        setCurrentPropertyIndex(index);
        switch (lastPropertyFocused.item.schema['@type']) {
            case DTDLSchemaType.Object:
                setPropertySelectorVisible(true);
                return;
            case DTDLSchemaType.Enum:
                setModalBody(DTDLSchemaType.Enum);
                setModalOpen(true);
                return;
            default:
                return;
        }
    };

    const deleteNestedItem = (parentIndex, index) => {
        setModel((prevModel) => {
            const newModel = deepCopy(prevModel);
            if (
                newModel.contents[parentIndex].schema['@type'] ===
                DTDLSchemaType.Enum
            ) {
                newModel.contents[parentIndex].schema.enumValues.splice(
                    index,
                    1
                );
            } else if (
                newModel.contents[parentIndex].schema['@type'] ===
                DTDLSchemaType.Object
            ) {
                newModel.contents[parentIndex].schema.fields.splice(index, 1);
                return newModel;
            }
            return newModel;
        });
    };

    return (
        <Stack
            className={getItemClassName(index)}
            draggable
            onDragStart={(e) => {
                handleDragStart(e, index);
            }}
            onDragEnter={
                draggingProperty
                    ? (e) => handleDragEnter(e, index)
                    : () => handleDragEnterExternalItem(index)
            }
            onFocus={() => {
                setLastPropertyFocused({
                    item: item,
                    index: index
                });
            }}
            tabIndex={0}
        >
            <Stack className={propertyInspectorStyles.propertyItemNestMainItem}>
                <ActionButton
                    onClick={() => deleteItem(index)}
                    className={propertyInspectorStyles.propertyItemIconWrap}
                >
                    <FontIcon
                        iconName={'ChromeClose'}
                        className={propertyInspectorStyles.propertyItemIcon}
                    />
                </ActionButton>

                <TextField
                    className={propertyInspectorStyles.propertyItemTextField}
                    borderless
                    placeholder={item.name}
                    validateOnFocusOut
                    onChange={() => {
                        setCurrentPropertyIndex(index);
                    }}
                    onGetErrorMessage={getErrorMessage}
                />
                <Text>{item.schema['@type']}</Text>
            </Stack>
            {item.schema['@type'] === 'Object' &&
                item.schema.fields.length > 0 &&
                item.schema.fields.map((field, i) => (
                    <PropertyListItemNested
                        key={i}
                        item={field}
                        parentIndex={index}
                        index={i}
                        getItemClassName={getNestedItemClassName}
                        setCurrentNestedPropertyIndex={
                            setCurrentNestedPropertyIndex
                        }
                        setCurrentPropertyIndex={setCurrentPropertyIndex}
                        setModalOpen={setModalOpen}
                        deleteNestedItem={deleteNestedItem}
                    />
                ))}

            {item.schema['@type'] === DTDLSchemaType.Enum &&
                item.schema.enumValues.length > 0 &&
                item.schema.enumValues.map((item, i) => (
                    <PropertyListEnumItemNested
                        key={i}
                        item={item}
                        model={model}
                        setModel={setModel}
                        parentIndex={index}
                        index={i}
                        deleteNestedItem={deleteNestedItem}
                    />
                ))}

            {item.schema['@type'] === DTDLSchemaType.Map && (
                <PropertyListMapItemNested
                    item={item}
                    model={model}
                    setModel={setModel}
                    index={index}
                />
            )}

            {lastPropertyFocused &&
                lastPropertyFocused.index === index &&
                item.schema['@type'] !== DTDLSchemaType.Map && (
                    <AddPropertyBar callback={addPropertyCallback} />
                )}
        </Stack>
    );
};

export default PropertyListItemNest;
