module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: __dirname,
    libraryTarget: 'commonjs2'
  },
  module:{
    rules:[
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['env', 'react'],
          plugins: ['transform-class-properties']
        }
      }
    ]
  },
  externals: {
    'react': 'commonjs react'
  }
}