// webpack.config.js
import path from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isProduction = argv?.mode === 'production';

  return {
    entry: {
      main: path.resolve(__dirname, 'src', 'public', 'js', 'main.ts')
    },
    output: {
      path: path.resolve(__dirname, 'dist', 'public'),
      filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
      publicPath: '/'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true
            }
          }
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        },
        {
          test: /\.s?css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.(png|jpe?g|gif|svg|webp)$/i,
          type: 'asset',
          generator: {
            filename: 'images/[name].[hash:8][ext]'
          }
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: isProduction ? 'css/[name].[contenthash:8].css' : 'css/[name].css'
      })
    ],
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    }
  };
};
