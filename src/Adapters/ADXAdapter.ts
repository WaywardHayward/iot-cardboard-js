import {
    IAuthService,
    ITsiClientChartDataAdapter
} from '../Models/Constants/Interfaces';
import AdapterMethodSandbox from '../Models/Classes/AdapterMethodSandbox';
import { CardErrorType } from '../Models/Constants/Enums';
import axios from 'axios';
import { SearchSpan, TsiClientAdapterData } from '../Models/Classes';
import TsqExpression from 'tsiclient/TsqExpression';
import { transformTsqResultsForVisualization } from 'tsiclient/Transformers';

export default class ADXAdapter implements ITsiClientChartDataAdapter {
    private authService: IAuthService;
    private clusterUrl: string;
    private databaseName: string;
    private tableName: string;

    constructor(
        clusterUrl: string,
        databaseName: string,
        tableName: string,
        authService: IAuthService
    ) {
        this.clusterUrl = clusterUrl;
        this.databaseName = databaseName;
        this.tableName = tableName;
        this.authService = authService;
        this.authService.login();
    }
    async getTsiclientChartDataShape(
        id: string,
        searchSpan: SearchSpan,
        properties: string[]
    ) {
        const adapterMethodSandbox = new AdapterMethodSandbox(this.authService);

        return await adapterMethodSandbox.safelyFetchData(async (token) => {
            const tsqExpressions = [];
            properties.forEach((prop) => {
                const variableObject = {
                    [prop]: {
                        kind: 'numeric',
                        value: { tsx: `$event.${prop}.Double` },
                        filter: null,
                        aggregation: { tsx: 'avg($value)' }
                    }
                };
                const tsqExpression = new TsqExpression(
                    { timeSeriesId: [id] },
                    variableObject,
                    searchSpan,
                    { alias: prop }
                );
                tsqExpressions.push(tsqExpression);
            });

            let adxResults;
            try {
                const axiosGets = properties.map(async (prop) => {
                    return await axios({
                        method: 'post',
                        url: `${this.clusterUrl}/v2/rest/query`,
                        headers: {
                            Authorization: 'Bearer ' + token,
                            Accept: 'application/json',
                            'Content-Type': 'application/json'
                        },
                        data: {
                            db: this.databaseName,
                            csl: `${
                                this.tableName
                            } | where Id contains "${id}" and Key contains "${prop}" and TimeStamp between (datetime(${searchSpan.from.toISOString()}) .. datetime(${searchSpan.to.toISOString()}))`
                        }
                    });
                });

                adxResults = await axios.all(axiosGets);
            } catch (err) {
                adapterMethodSandbox.pushError({
                    type: CardErrorType.DataFetchFailed,
                    isCatastrophic: true,
                    rawError: err
                });
            }

            const tsqResults = [];
            adxResults.map((result, idx) => {
                const primaryResultFrames = result.data.filter(
                    (frame) => frame.TableKind === 'PrimaryResult'
                );
                if (primaryResultFrames.length) {
                    const timeStampColumnIndex = primaryResultFrames[0].Columns.findIndex(
                        (c) => c.ColumnName === 'TimeStamp'
                    );
                    const valueColumnIndex = primaryResultFrames[0].Columns.findIndex(
                        (c) => c.ColumnName === 'Value'
                    );
                    const mergedTimeStampAndValuePairs = [];
                    primaryResultFrames.forEach((rF) =>
                        rF.Rows.forEach((r) =>
                            mergedTimeStampAndValuePairs.push([
                                r[timeStampColumnIndex],
                                r[valueColumnIndex]
                            ])
                        )
                    );
                    const adxTimestamps = mergedTimeStampAndValuePairs.map(
                        (tSandValuePair) => tSandValuePair[0]
                    );
                    const adxValues = mergedTimeStampAndValuePairs.map(
                        (tSandValuePair) => tSandValuePair[1]
                    );
                    const tsqResult = {};
                    tsqResult['timestamps'] = adxTimestamps;
                    tsqResult['properties'] = [
                        {
                            values: adxValues,
                            name: properties[idx],
                            type: 'Double'
                        }
                    ];
                    tsqResults.push(tsqResult);
                }
            });

            const transformedResults = transformTsqResultsForVisualization(
                tsqResults,
                tsqExpressions
            ) as any;

            return new TsiClientAdapterData(transformedResults);
        });
    }
}