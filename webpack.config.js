module.exports = {
  entry: './app/app.jsx',
  output: {
    path: __dirname,
    filename: './public/bundle.js',
    publicPath: '/'
  },
  resolve: {
    root: __dirname,
    alias: {

    },
    modulesDirectories: [
      'node_modules',
      'app',
      'app/components'
    ],
    extensions: ['', '.js', '.jsx', '.css']
  },
  module: {
    loaders: [{
      loader: 'babel-loader',
      query: {
        presets: ['react', 'es2015'],
        plugins:[ 'transform-object-rest-spread' ]
      },
      test: /\.jsx?$/,
      exclude: /(node_modules|bower_components)/
    }, {
      test: [/\.svg$/, /\.jpg$/, /\.gif$/, /\.png$/],
      loader: 'file-loader?name=images/[name].[ext]'
    }, {
      test: /\.css$/,
      loader: "style-loader!css-loader"
    },{
      test: /\.(eot|svg|ttf|woff|woff2)$/,
      loader: 'file-loader?name=fonts/[name].[ext]',
    }]
  },
  devServer: {
    historyApiFallback: true,
  }
};
