import React, {PropTypes} from "react";
import {
    View,
    Text,
    StyleSheet,
    ListView,
    Animated,
    TouchableOpacity,
    PixelRatio,
    NativeModules,
    LayoutAnimation,
} from "react-native";
import moment from "moment";
import debugService from "./LoggerService";
import InvertibleScrollView from "react-native-invertible-scroll-view";
const NativeAnimatedModule = NativeModules.NativeAnimatedModule;
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(
    TouchableOpacity
);
const PRIMARY_COLOR = "#3b3b3b";
const SELECT_COLOR = "#FFFF00";
const SEPERATOR_COLOR = "rgb(252, 217, 28)";
const SECONDARY_COLOR = "#FFFFFF";
const TEXT_COLOR = "#D6D6D6";
const LISTVIEW_REF = "listview";
export default class HttpLogListView extends React.Component {

    static propTypes = {
        onHttpLogPress:PropTypes.func, // http log data has been pressed, usage: onHttpLogPress(httpLog)
    };

    constructor() {
        super();
        let ds = new ListView.DataSource({
            rowHasChanged: (r1, r2) => {
                let rowHasChanged = r1.id !== r2.id;
                if (r1.expanded !== r2.expanded) {
                    return true;
                }
                return rowHasChanged;
            },
        });
        this.preparedRows = { blob: {} };
        this.state = {
            dataSource: ds.cloneWithRows([]),
            paused: false,
            rows: [],
        };
    }

    componentWillMount() {
        console.log('HttpLogListView onHttpLogPress', this.props.onHttpLogPress);
    }

    prepareRows(rows) {
        return rows.reduce((o, m, i) => {
            const previousRender =
                this.preparedRows !== undefined
                    ? this.preparedRows[m.id]
                    : null;
            const previousRenderExists = !!previousRender;
            o[m.id] = {
                ...m,
                anim: previousRenderExists
                    ? previousRender.anim
                    : new Animated.Value(0),
            };
            return o;
        }, {});
    }

    renderList(props) {
        if (!this.state.paused) {
            this.preparedRows = this.prepareRows(props.rows);
            this.setState({
                rows: props.rows,
                dataSource: this.state.dataSource.cloneWithRows(
                    this.preparedRows
                ),
            });
        }
    }

    componentWillReceiveProps(nextProps) {
        this.renderList(nextProps);
    }

    onPauseButtonPressed() {
        this.setState({
            paused: !this.state.paused,
        });
        this.renderList(this.props);
    }

    onClearButtonPressed() {
        debugService.clear();
    }

    _formatTimeStamp(timeStamp, rowData) {
        if (rowData.format) {
            return rowData.format(timeStamp);
        }
        return timeStamp.format(this.props.timeStampFormat || "HH:mm:ss");
    }

    onRowPress(sectionID, rowID) {
        const rowBefore = this.preparedRows[rowID];
        if (this.props.multiExpanded) {
            const row = this.state.rows.find(row => row.id === rowID);
            row.expanded = !row.expanded;
        } else {
            this.state.rows.forEach(row => {
                row.expanded = row.id === rowID && !row.expanded;
            });
        }
        this.preparedRows = this.prepareRows(this.state.rows);
        LayoutAnimation.configureNext({
            update: {
                springDamping: 0.7,
                type: "spring",
            },
            duration: 650,
        });
        this.setState({
            dataSource: this.state.dataSource.cloneWithRows(this.preparedRows),
        });
    }

    onRowLayout(rowData) {
        Animated.timing(rowData.anim, {
            useNativeDriver: !!NativeAnimatedModule,
            toValue: 1,
            duration: 700,
        }).start();
    }

    _renderSeperator(rowData, sectionID, rowID, highlightRow, animationStyle) {
        const seperatorStyles = [
            styles.logRowMessage,
            styles.logRowMessageBold,
            styles.seperator,
        ];
        return (
            <Animated.View
                style={[styles.debugRowContainer, animationStyle]}
                onLayout={this.onRowLayout.bind(this, rowData)}
            >
                <Text style={seperatorStyles}>*****</Text>
                <Text
                    style={[
                        styles.logRowMessage,
                        styles.logRowMessageMain,
                        styles.logRowMessageSeperator,
                    ]}
                >
                    {rowData.message}
                    - {rowData.timeStamp.format("YYYY-MM-DD HH:mm:ss")}
                </Text>
                <Text style={seperatorStyles}>*****</Text>
            </Animated.View>
        );
    }

    // Render a single row
    _renderLogRow(rowData, sectionID, rowID, highlightRow, animationStyle) {
        console.log(rowData);
        let httpLog = rowData.message;

        try {
            httpLog = JSON.parse(httpLog);
        } catch(e) {
            console.log(e);
        }

        return (
            <Animated.View
                style={[
                    styles.debugRowContainer,
                    animationStyle,
                    {
                        backgroundColor: rowData.expanded
                            ? SELECT_COLOR
                            : "transparent",
                    },
                ]}
                onLayout={this.onRowLayout.bind(this, rowData)}
            >
                <TouchableOpacity
                    style={[
                        styles.debugRowContainerButton,
                        {
                            //maxHeight: rowData.expanded ? undefined : 25, this.onRowPress.bind(this, sectionID, rowID)
                        },
                    ]}
                    onPress={ () => {
                        httpLog && httpLog.url && this.props.onHttpLogPress && this.props.onHttpLogPress(httpLog)} }
                >
                    <Text
                        style={[
                            styles.logRowMessage,
                            styles.logRowMessageMain,
                            {
                                color: httpLog.ok? 'green':'red'
                            },
                        ]}

                        numberOfLines={2}
                    >
                        {httpLog.url || httpLog}
                    </Text>

                    <View style={{flexDirection: "row",
                        flex: 1,}}>
                        <Text style={{marginRight:5, color: httpLog.ok? 'green':'red' }}>{httpLog.status}</Text>
                        <Text style={{marginRight:5}}>{httpLog.method}</Text>
                        <Text style={{marginRight:5}}>{httpLog.responseContentType}</Text>
                        <Text style={{marginRight:5}}>{httpLog.duration}ms</Text>
                        <Text style={{marginRight:5}}>{httpLog.responseContentLength}字节</Text>
                        <Text>
                            {this._formatTimeStamp(rowData.timeStamp, rowData)}
                        </Text>
                    </View>

                    { httpLog.errorMsg &&
                    <Text style={{marginRight:5, color: httpLog.ok? 'green':'red' }}>{httpLog.errorMsg}</Text>
                    }

                </TouchableOpacity>
            </Animated.View>
        );
    }

    _renderRow(rowData, sectionID, rowID, highlightRow) {
        let animationStyle = {};
        if (rowData.anim) {
            animationStyle = {
                opacity: rowData.anim,
                transform: [
                    {
                        scale: rowData.anim.interpolate({
                            inputRange: [0, 0.3, 1],
                            outputRange: [1, 1.05, 1],
                        }),
                    },
                ],
            };
        }

        switch (rowData.level) {
            case "seperator":
                return this._renderSeperator(
                    rowData,
                    sectionID,
                    rowID,
                    highlightRow,
                    animationStyle
                );
            default:
                return this._renderLogRow(
                    rowData,
                    sectionID,
                    rowID,
                    highlightRow,
                    animationStyle
                );
        }
    }

    onCenterColumnPressed() {
        if (this.refs[LISTVIEW_REF]) {
            this.refs[LISTVIEW_REF].scrollTo({ x: 0, y: 0, animated: true });
        }
    }

    _renderSeparator(sectionID, rowID, adjacentRowHighlighted) {
        return (
            <View
                key={`${sectionID}-${rowID}`}
                style={{
                    height: adjacentRowHighlighted ? 4 : 0,
                    backgroundColor: adjacentRowHighlighted
                        ? PRIMARY_COLOR
                        : "transparent",
                }}
            />
        );
    }

    render() {
        const { rows, ...props } = this.props;
        return (
            <View style={styles.container}>
                <View style={styles.toolBar}>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={this.onPauseButtonPressed.bind(this)}
                    >
                        <Text style={styles.toolbarButtonText}>
                            {this.state.paused ? "恢复更新" : "暂停更新"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={this.onCenterColumnPressed.bind(this)}
                        style={styles.centerColumn}
                    >
                        <Text style={styles.titleText}>{`${this.state.rows
                            .length} 行`}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={this.onClearButtonPressed.bind(this)}
                    >
                        <Text style={styles.toolbarButtonText}>清除日志</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.listContainer}>
                    <ListView
                        renderSeparator={this._renderSeparator.bind(this)}
                        keyboardShouldPersistTaps="always"
                        automaticallyAdjustContentInsets={false}
                        initialListSize={20}
                        pageSize={20}
                        renderScrollComponent={props => (
                            <InvertibleScrollView
                                {...props}
                                inverted={this.props.inverted}
                            />
                        )}
                        enableEmptySections={true}
                        ref={LISTVIEW_REF}
                        dataSource={this.state.dataSource}
                        renderRow={this._renderRow.bind(this)}
                        {...props}
                    />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: SECONDARY_COLOR,
        paddingTop: 5,
    },
    toolBar: {
        backgroundColor: SECONDARY_COLOR,
        flexDirection: "row",
        padding: 10,
        borderBottomWidth: 2,
        borderColor: PRIMARY_COLOR,
    },
    toolbarButton: {
        padding: 7,
        borderWidth: 2,
        borderRadius: 7,
        borderColor: PRIMARY_COLOR,
    },
    centerColumn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    titleText: {
        fontWeight: "bold",
        fontFamily: "System",
        fontSize: 16,
        alignSelf: "center",
        textAlign: "center",
    },
    toolbarButtonText: {
        color: '#006FFF',
    },
    listContainer: {
        flex: 1,
    },
    debugRowContainer: {
        padding: 5,
        flex: 1,
        flexDirection: "row",
        backgroundColor: SECONDARY_COLOR,
        borderStyle: "solid",
        borderBottomWidth: 1 / PixelRatio.get(),
        borderBottomColor: PRIMARY_COLOR,
    },
    debugRowContainerButton: {
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
    },
    logRowMessage: {
        color: TEXT_COLOR,
        // fontFamily: "System",
        // fontSize: 12,
        // paddingHorizontal: 5,
        lineHeight: 20,
    },
    logRowMessageBold: {
        fontWeight: "bold",
    },
    logRowLevelLabel: {
        minWidth: 80,
        fontWeight: "bold",
    },
    logRowMessageSeperator: {
        fontSize: 11,
        fontWeight: "bold",
        textAlign: "center",
        color: SEPERATOR_COLOR,
    },
    seperator: {
        fontSize: 18,
        color: SEPERATOR_COLOR,
    },
    logRowMessageMain: {
        flex: 1,
    },
    welcome: {
        fontSize: 20,
        textAlign: "center",
        margin: 10,
    },
    instructions: {
        textAlign: "center",
        color: "#333333",
        marginBottom: 5,
    },
});
