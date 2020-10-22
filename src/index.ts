import axios from 'axios';
import cheerio from 'cheerio';

const exampleAddresses = [
    '3950 CALLAHAN DR, Memphis, TN 38127',
    '17421 Deforest Ave, Cleveland, OH 44128',
    '1226 DIVISION AVENUE, San Antonio, TX 78225',
    '3950 CALLAHAN RD, Memphis, TN 38127',
    '1226 DIVISION St, San Antonio, TX 78225',
];


(async () => {

    for (let i = 0; i < exampleAddresses.length; i++) {
        // get the property details path/url

        const path = await getPath(exampleAddresses[i]);

        console.log('Path', path);

        // go to the property details path/url and get estimate
        if (path) {
            const price = await getPrice(path);

            console.log('price', price);
        }
    }
})();


async function getPath(address: string) {
    const url = `https://www.trulia.com/graphql`;

    // Location and v are required query parameters
    const splitAddress = address.split(',');

    // Format the street part so we can remove the last word (hopefully rd/st/dr/etc)
    // We probably should only do this if there are more than two words in the street
    const splitStreetAddress = splitAddress[0].split(' ');
    if (splitStreetAddress.length > 2) {
        splitStreetAddress.pop();
    }
    const formattedStreetAddress = splitStreetAddress.join(' ');

    // Get the rest of the address (city, state, and zip)
    splitAddress.shift();
    const theRestOfTheAddress = splitAddress.join(' ');

    const payload = {
        opeartionName: 'searchBoxAutosuggest',
        variables: {
            query: `${formattedStreetAddress} ${theRestOfTheAddress}`,
            searchType: 'FOR_SALE'
        },
        query: "query searchBoxAutosuggest($query: String!, $searchType: SEARCHAUTOCOMPLETE_SearchType, $mostRecentSearchLocations: [SEARCHDETAILS_LocationInput]) {\n  searchLocationSuggestionByQuery(query: $query, searchType: $searchType, mostRecentSearchLocations: $mostRecentSearchLocations) {\n    places {\n        __typename\n        ...on SEARCHAUTOCOMPLETE_Region{ title details searchEncodedHash }\n        ...on SEARCHAUTOCOMPLETE_Address { title details searchEncodedHash url }\n      }\n    schools { title subtitle details searchEncodedHash }\n    \n  }\n}"
    };

    const axiosResponse = await axios.post(url, payload, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36'
        }
    });

    return axiosResponse.data?.data?.searchLocationSuggestionByQuery?.places[0]?.url;
}

async function getPrice(path: string) {
    const url = `https://trulia.com${path}`;

    const axiosResponse = await axios.get(url, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
            'cookie': '_pxhd=8c9673c1f4056ee7a77627ded7c8d4cb1e8d42054109dcfdf672184d1e1f55d5:5b1e9741-1205-11eb-b1e9-a7e8d53ee70d; tlftmusr=201019qig7kp1lgl74u9t6o21rwpm022; zjs_user_id=null; _pxvid=5b1e9741-1205-11eb-b1e9-a7e8d53ee70d; zjs_anonymous_id=%22201019qig7kp1lgl74u9t6o21rwpm022%22; s_fid=16ED6EFD94A2BF4E-213974C00E9509F5; s_vi=[CS]v1|2FC6C22D0515A937-60000B66EC7F9CDD[CE]; QSI_S_ZN_aVrRbuAaSuA7FBz=v:0:0; _csrfSecret=DH22skBX8VMM7gABqyjqooKX; s_cc=true; g_state={"i_p":1603374232256,"i_l":1}; trul_visitTimer=1603366896615_1603367532459; OptanonConsent=isIABGlobal=false&datestamp=Thu+Oct+22+2020+05%3A52%3A12+GMT-0600+(Mountain+Daylight+Time)&version=5.8.0&landingPath=NotLandingPage&groups=1%3A1%2C0_234869%3A1%2C3%3A1%2C4%3A1%2C0_234866%3A1%2C0_234867%3A1%2C0_234868%3A1%2C0_240782%3A1%2C0_240783%3A1%2C0_240780%3A1%2C0_234871%3A1%2C0_240781%3A1%2C0_234872%3A1%2C0_234873%3A1%2C0_234874%3A1%2C0_234875%3A1%2C0_234876%3A1%2C0_234877%3A1&AwaitingReconsent=false; _px3=f7d9fac3630e1dd422e475ff793186284795bc5aa6363614943b8bf5cd2b6a73:Pj+xFCVT2i7AyMCUvgrcfd/KjikynxhMnmim3uqRqZ5niEPAyFqN54FutfRPfxD2HTFyDqD8H2ZEdAqf09CxxQ==:1000:ViYMtJksk/0GJJbGnGJz8XSWcTP+533Le6v5P9XTr+YxNhPZCBvCWNRQNkIhXCVQ+E/SJyCxiYr34P5Fir/Dv7kfgnQ72Agl8Gc+zaV5xEpeNnQ8ujJlhvYyIAsGk041Px4/k6JRjhpTIK6dhDwVHo2UEDnzpKQZ5B0I5YoBpTA='
        }
    });

    const $ = cheerio.load(axiosResponse.data);

    const price = $('[data-testid="home-details-sm-lg-xl-price-details"] .qAaUO').text();

    return price;
}