import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    mode: 'production', // Включает все оптимизации

    entry: {
        main: './src/client/less/main.less',
        users: './src/client/js/users.js',
        friends: './src/client/js/friends.js',
        news: './src/client/js/news.js',
        messages: './src/client/js/messages.js'
    },

    output: {
        path: path.resolve(__dirname, 'dist-webpack'),
        filename: 'js/[name].[contenthash].js', // [name] = users, friends и т.д.
        clean: true // Очищает папку перед каждой сборкой
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'], // Поддержка старых браузеров
                        plugins: ['@babel/plugin-syntax-dynamic-import'] // Динамические импорты
                    }
                }
            },
            {
                test: /\.less$/,
                use: [
                    MiniCssExtractPlugin.loader, // Извлекает CSS в отдельный файл
                    'css-loader',  // Обрабатывает @import, url()
                    'less-loader' // Компилирует LESS в CSS
                ]
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            },
            {
                test: /\.pug$/,
                use: [
                    {
                        loader: 'pug-loader',
                        options: {
                            pretty: false
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name].[hash][ext]'
                }
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name].[hash][ext]'
                }
            }
        ]
    },

    plugins: [
        new MiniCssExtractPlugin({ //Без плагина: CSS был бы встроен в JS файлы
            filename: 'css/[name].[contenthash].css' // c плагином: Отдельные оптимизированные CSS файлы
        }),

        new HtmlWebpackPlugin({
            template: './src/client/views/users.pug',
            filename: 'html/users.html',
            chunks: ['users', 'main'] // Подключает users.js + main.css
        }),

        new HtmlWebpackPlugin({
            template: './src/client/views/friends.pug',
            filename: 'html/friends.html',
            chunks: ['friends', 'main']
        }),

        new HtmlWebpackPlugin({
            template: './src/client/views/news.pug',
            filename: 'html/news.html',
            chunks: ['news', 'main']
        }),

        new HtmlWebpackPlugin({
            template: './src/client/views/messages.pug',
            filename: 'html/messages.html',
            chunks: ['messages', 'main']
        }),

        new HtmlWebpackPlugin({
            template: './src/client/views/users.pug',
            filename: 'html/index.html',
            chunks: ['users', 'main']
        })
    ],

    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin(),  // Минификация JavaScript
            new CssMinimizerPlugin() // Минификация CSS
        ],
        //Разделение кода:
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/, // Все node_modules
                    name: 'vendors',                   // В отдельный файл Создает vendors.[hash].js
                    chunks: 'all'
                }
            }
        }
    },

    resolve: {
        extensions: ['.js', '.less', '.css']
    }
};