import React, {PropTypes} from "react";
import { View, StyleSheet } from "react-native";
import DebugListView from "./HttpLogListView.js";
import debugService from "./LoggerService";
import debounce from "debounce";

export default class HttpLogView extends React.Component {
    static propTypes = {
        onHttpLogPress:PropTypes.func, // http log data has been pressed, usage: onHttpLogPress(httpLog)
    };

    static navigatorStyle = {
        navBarHidden: false, // 隐藏默认的顶部导航栏
        tabBarHidden: true, // 隐藏默认的底部Tab栏
    };

    constructor() {
        super();
        this.state = {
            rows: [],
        };
        this.unmounted = false;
        this.updateDebounced = debounce(this.update.bind(this), 150);
    }

    componentWillUnmount() {
        this.unmounted = true;
        if (this.listner) {
            this.listner();
        }
    }

    update(data) {
        if (data) {
            if (!this.unmounted) {
                this.setState({ rows: data });
            }
        }
    }

    componentWillMount() {
        this.listner = debugService.onDebugRowsChanged(this.updateDebounced);
        console.log('HttpLogView onHttpLogPress', this.props.onHttpLogPress);
    }

    render() {
        return (
            <View style={styles.container}>
                <DebugListView rows={this.state.rows} {...this.props} />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
