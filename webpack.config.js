const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlwebpackPlugin = require('html-webpack-plugin');

const pkg = require('./package.json');
const TARGET = process.env.npm_lifecycle_event;
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanPlugin = require('clean-webpack-plugin');


const PATHS = {
    app  : path.join(__dirname, 'app'),
    build: path.join(__dirname, 'build'),
    style: path.join(__dirname, 'app/main.css')

};

process.env.BABEL_ENV = TARGET;

const common = {

    entry  : {
        app  : PATHS.app,
        style: PATHS.style

    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    output : {
        path         : PATHS.build,
        filename     : '[name].[chunkhash].js',
        chunkFilename: '[chunkhash].js'
    },
    module : {
        loaders: [

            {
                test   : /\.jsx|js?$/,
                // Enable caching for improved performance during development
                // It uses default OS directory by default. If you need something
                // more custom, pass a path to it. I.e., babel?cacheDirectory=<path>
                loaders: ['babel?cacheDirectory'],
                include: PATHS.app
            }
        ]
    },
    plugins: [
        new HtmlwebpackPlugin({
            template  : 'node_modules/html-webpack-template/index.html',
            title     : 'Kanban app',
            appMountId: 'app',
            inject    : false
        })
    ]
};


// Default configuration
if (TARGET === 'start' || !TARGET) {

    module.exports = merge(common, {

        devtool: 'eval',


        devServer: {
            historyApiFallback: true,
            hot               : true,
            inline            : true,
            progress          : true,

            // Display only errors to reduce the amount of output.
            //stats: 'errors-only',

            // Parse host and port from env so this is easy to customize.
            host: process.env.HOST,
            port: process.env.PORT
        },
        module   : {
            loaders: [
                // Define development specific CSS setup
                {
                    test   : /\.css$/,
                    loaders: ['style', 'css'],
                    include: PATHS.app
                }
            ]
        },
        plugins  : [
            new webpack.HotModuleReplacementPlugin(),
            new NpmInstallPlugin({
                save: true // --save
            })
        ]
    });

}


if(TARGET === 'build' || TARGET === 'stats') {

    module.exports = merge(common, {

        entry  : {
            vendor: Object.keys(pkg.dependencies).filter(function (v) {
                // Exclude alt-utils as it won't work with this setup
                // due to the way the package has been designed
                // (no package.json main).
                return v !== 'alt-utils';
            })
        },
        module : {
            loaders: [
                // Extract CSS during build
                {
                    test   : /\.css$/,
                    loader : ExtractTextPlugin.extract('style', 'css'),
                    include: PATHS.app
                }
            ]
        },
        plugins: [
            new CleanPlugin([PATHS.build]),
            new ExtractTextPlugin('[name].[chunkhash].css'),
            new webpack.optimize.CommonsChunkPlugin({
                names: ['vendor', 'manifest']
            }),
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false
                }
            }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': '"production"'
            }),

        ]
    });
}
