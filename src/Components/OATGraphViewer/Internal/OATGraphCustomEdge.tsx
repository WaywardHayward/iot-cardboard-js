import React, { useContext, useState } from 'react';
import { getBezierPath, getEdgeCenter } from 'react-flow-renderer';
import { IOATGraphCustomEdgeProps } from '../../Models/Constants/Interfaces';
import { getGraphViewerStyles } from '../OATGraphViewer.styles';
import { ElementsContext } from './OATContext';

const foreignObjectSize = 180;

const OATGraphCustomEdge: React.FC<IOATGraphCustomEdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
    markerEnd
}) => {
    const [nameEditor, setNameEditor] = useState(false);
    const [nameText, setNameText] = useState(data.name);
    const { elements, setElements } = useContext(ElementsContext);
    const graphViewerStyles = getGraphViewerStyles();

    const onNameChange = (evt) => {
        setNameText(evt.target.value);
    };

    const onNameClick = () => {
        setNameEditor(true);
    };

    const onNameBlur = () => {
        setNameEditor(false);
        if (data.name !== nameText) {
            const index = elements.findIndex(
                (element) => element.data.id === data.id
            );
            elements[index].data.name = nameText;
            setElements([...elements]);
        }
    };

    const edgePath = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition
    });
    const [edgeCenterX, edgeCenterY] = getEdgeCenter({
        sourceX,
        sourceY,
        targetX,
        targetY
    });

    return (
        <>
            <path
                id={id}
                style={style}
                className={graphViewerStyles.edgePath}
                d={edgePath}
                markerEnd={markerEnd}
                onClick={onNameClick}
            />
            {nameEditor && (
                <foreignObject
                    width={foreignObjectSize}
                    height={foreignObjectSize}
                    x={edgeCenterX - foreignObjectSize / 2}
                    y={edgeCenterY}
                    requiredExtensions="http://www.w3.org/1999/xhtml"
                >
                    <body>
                        <input
                            id="text"
                            name="text"
                            onChange={onNameChange}
                            value={nameText}
                            onBlur={onNameBlur}
                            autoFocus
                        />
                    </body>
                </foreignObject>
            )}
            {!nameEditor && (
                <text>
                    <textPath
                        href={`#${id}`}
                        style={{ fontSize: '12px' }}
                        className={graphViewerStyles.textPath}
                        startOffset="50%"
                        textAnchor="middle"
                        onClick={onNameClick}
                    >
                        {data.name}
                    </textPath>
                </text>
            )}

            <input
                id="text"
                name="text"
                onChange={onNameChange}
                value={nameText}
                onBlur={onNameBlur}
                autoFocus
            />
        </>
    );
};

export default OATGraphCustomEdge;