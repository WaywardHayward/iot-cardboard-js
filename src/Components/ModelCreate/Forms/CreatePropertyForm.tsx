import React, { useState } from 'react';
import { DefaultButton } from '@fluentui/react/lib/Button';
import {
    Dropdown,
    IDropdownOption,
    DropdownMenuItemType
} from '@fluentui/react/lib/Dropdown';
import { TextField } from '@fluentui/react/lib/TextField';
import { Toggle } from '@fluentui/react/lib/Toggle';
import { Stack } from '@fluentui/react/lib/Stack';
import {
    DTDLEnum,
    DTDLProperty,
    DTDLSchema,
    DTDLSemanticTypes
} from '../../../Models/Classes/DTDL';
import CreateEnumForm from './CreateEnumForm';
import BaseForm from './BaseForm';
import { useTranslation } from 'react-i18next';
import { DTDLNameRegex, DTMIRegex, FormMode } from '../../../Models/Constants';

export enum CreatePropertyMode {
    PropertyForm,
    EnumForm
}

interface CreatePropertyFormProps {
    onCancel: () => void;
    onPrimaryAction: (property: DTDLProperty) => void;
    pushBreadcrumb: (breadcrumbKey: string) => void;
    popBreadcrumb: () => void;
    propertyToEdit?: DTDLProperty;
    formControlMode?: FormMode;
}

const CreatePropertyForm: React.FC<CreatePropertyFormProps> = ({
    onCancel,
    onPrimaryAction,
    pushBreadcrumb,
    popBreadcrumb,
    propertyToEdit = null,
    formControlMode = FormMode.Edit
}) => {
    const { t } = useTranslation();

    const [mode, setMode] = useState(CreatePropertyMode.PropertyForm);

    const schemaOptions: IDropdownOption[] = [
        {
            key: 'primitives',
            text: t('modelCreate.primitives'),
            itemType: DropdownMenuItemType.Header
        },
        { key: 'boolean', text: 'boolean' },
        { key: 'date', text: 'date' },
        { key: 'dateTime', text: 'dateTime' },
        { key: 'double', text: 'double' },
        { key: 'duration', text: 'duration' },
        { key: 'float', text: 'float' },
        { key: 'integer', text: 'integer' },
        { key: 'long', text: 'long' },
        { key: 'string', text: 'string' },
        { key: 'time', text: 'time' },
        { key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider },
        {
            key: 'complexSchema',
            text: t('modelCreate.complexSchema'),
            itemType: DropdownMenuItemType.Header
        },
        { key: 'enum', text: 'Enum' },

        // TODO: 'object' and 'map' schema types are not fully supported yet.
        // Update: iremay added data classes for those, should test integration
        { key: 'object', text: 'Object' },
        { key: 'map', text: 'Map' }
    ];

    const parseSchema = (schema: DTDLSchema) => {
        const findDropdownOption = (key: string) => {
            const filtered = schemaOptions.filter(
                (o) => o.key === key.toLowerCase()
            );
            return filtered[0];
        };

        if (typeof schema === 'string') {
            return {
                schema,
                option: findDropdownOption(schema)
            };
        } else if (typeof schema === 'object') {
            return {
                schema,
                option: findDropdownOption(schema['@type'])
            };
        }
    };

    const initialProperty = propertyToEdit ?? DTDLProperty.getBlank();
    const typeInfo = initialProperty['@type'];
    const schemaInfo = parseSchema(initialProperty.schema);
    const [id, setId] = useState(initialProperty['@id']);
    const [name, setName] = useState(initialProperty.name);
    const [displayName, setDisplayName] = useState(initialProperty.displayName);
    const [comment, setComment] = useState(initialProperty.comment);
    const [description, setDescription] = useState(initialProperty.description);
    const [schemaDropdown, setSchemaDropdown] = useState<IDropdownOption>(
        schemaInfo.option
    );
    const [schema, setSchema] = useState<DTDLSchema>(schemaInfo.schema);
    const [unit, setUnit] = useState(initialProperty.unit);
    const [writable, setWritable] = useState(initialProperty.writable);

    const onClickCreate = () => {
        const property = new DTDLProperty(
            id,
            name,
            schema,
            comment,
            description,
            displayName,
            unit,
            writable
        );
        onPrimaryAction(property);
    };

    const onSchemaOptionChange = (option: IDropdownOption) => {
        setSchemaDropdown(option);

        // For complex schema, set the value of the schema as 'null' to make
        // it easier to validate that the user has specified the schema.
        if (['object', 'map', 'enum'].includes(option.key as string)) {
            setSchema(null);
        } else {
            setSchema(option.key as DTDLSchema);
        }
    };

    const handleCreateEnum = (newEnum: DTDLEnum) => {
        setSchema(newEnum);
        backToPropetyFrom();
    };

    const addStep = (mode: CreatePropertyMode, breadcrumbKey: string) => {
        setMode(mode);
        pushBreadcrumb(breadcrumbKey);
    };

    const backToPropetyFrom = () => {
        setMode(CreatePropertyMode.PropertyForm);
        popBreadcrumb();
    };

    return (
        <>
            {mode === CreatePropertyMode.PropertyForm && (
                <BaseForm
                    primaryActionLabel={
                        propertyToEdit === null ? t('add') : t('update')
                    }
                    cancelLabel={t('cancel')}
                    onPrimaryAction={onClickCreate}
                    onCancel={onCancel}
                    formControlMode={formControlMode}
                >
                    <TextField
                        label={t('modelCreate.propertyId')}
                        value={id}
                        placeholder="<scheme>:<path>;<version>"
                        description={'e.g., dtmi:com:example:property1;1'}
                        onChange={(e) => setId(e.currentTarget.value)}
                        errorMessage={
                            id && !DTMIRegex.test(id)
                                ? t('modelCreate.invalidIdentifier', {
                                      dtmiLink: 'http://aka.ms/ADTv2Models'
                                  })
                                : ''
                        }
                        readOnly={formControlMode === FormMode.Readonly}
                    />
                    <TextField
                        label={t('name')}
                        value={name}
                        onChange={(e) => setName(e.currentTarget.value)}
                        required
                        errorMessage={
                            name && !DTDLNameRegex.test(name)
                                ? t('modelCreate.invalidDTDLName', {
                                      dtdlLink: 'http://aka.ms/ADTv2Models'
                                  })
                                : ''
                        }
                        readOnly={formControlMode === FormMode.Readonly}
                    />
                    <TextField
                        label={t('modelCreate.displayName')}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.currentTarget.value)}
                        readOnly={formControlMode === FormMode.Readonly}
                    />
                    <Stack>
                        <Dropdown
                            selectedKey={
                                schemaDropdown ? schemaDropdown.key : undefined
                            }
                            label={t('modelCreate.schema')}
                            placeholder={t('modelCreate.selectOption')}
                            onChange={(_e, option) =>
                                onSchemaOptionChange(option)
                            }
                            options={schemaOptions}
                            required
                            disabled={formControlMode === FormMode.Readonly}
                        />
                        {formControlMode !== FormMode.Readonly &&
                            schemaDropdown?.key === 'enum' && (
                                <DefaultButton
                                    onClick={() =>
                                        addStep(
                                            CreatePropertyMode.EnumForm,
                                            'modelCreate.addEnumSchema'
                                        )
                                    }
                                >
                                    {t('modelCreate.addEnumSchema')}
                                </DefaultButton>
                            )}
                    </Stack>
                    <TextField
                        label={t('modelCreate.description')}
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                        readOnly={formControlMode === FormMode.Readonly}
                    />
                    <TextField
                        label={t('modelCreate.comment')}
                        multiline
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.currentTarget.value)}
                        readOnly={formControlMode === FormMode.Readonly}
                    />
                    <TextField
                        label={t('modelCreate.unit')}
                        value={unit}
                        onChange={(e) => setUnit(e.currentTarget.value)}
                        errorMessage={
                            unit &&
                            !DTDLSemanticTypes.map(
                                (t) => t.SemanticType
                            ).includes(typeInfo)
                                ? t('modelCreate.invalidTypeForUnitSupport')
                                : ''
                        }
                        readOnly={formControlMode === FormMode.Readonly}
                    />
                    <Toggle
                        label={t('modelCreate.writable')}
                        onText={t('modelCreate.true')}
                        offText={t('modelCreate.false')}
                        defaultChecked={writable}
                        onChange={(_e, checked) => setWritable(checked)}
                        disabled={formControlMode === FormMode.Readonly}
                    />
                </BaseForm>
            )}

            {mode === CreatePropertyMode.EnumForm && (
                <CreateEnumForm
                    pushBreadcrumb={pushBreadcrumb}
                    popBreadcrumb={popBreadcrumb}
                    onCreateEnum={handleCreateEnum}
                    onCancel={backToPropetyFrom}
                />
            )}
        </>
    );
};

export default CreatePropertyForm;
