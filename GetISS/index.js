const axios = require('axios');
const ISS_API_URL = 'https://api.wheretheiss.at/v1/satellites/25544';

//ISSの現在位置
async function getISS(){
    try {
        const response = await axios.get(ISS_API_URL);
        const { latitude: ido, longitude: keido, altitude: kodo, velocity: sokudo, visibility: kansoku } = response.data;        
        console.log('ISS現在位置:');
        console.log(`緯度: ${ido.toFixed(2)}`);
        console.log(`経度: ${keido.toFixed(2)}`);
        console.log(`高度: ${kodo.toFixed(2)} km`);
        console.log(`速度: ${sokudo.toFixed(2)} km/h`);
        console.log(`観測の可能性: ${kansoku === 'eclipsed' ? 'できる' : 'できない'}`);
    } catch (error) {
        console.error('データの取得エラー', error.message);
    }
}
getISS();
