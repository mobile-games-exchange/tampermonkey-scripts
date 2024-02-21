// ==UserScript==
// @name         MGX Toolkit - CeX Sell Basket Transfer
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  Custom script for webuy.com
// @author       Diogo Novo
// @match        https://uk.webuy.com/sell/basket/
// @include      https://uk.webuy.com/sell/basket/
// @grant        GM_setValue
// @grant        GM_getValue
// @require https://code.jquery.com/jquery-2.1.4.min.js
// @require file://C:\keys.js
// @downloadURL  https://raw.githubusercontent.com/mobile-games-exchange/tampermonkey-scripts/main/CeXSellBasketTransfer.user.js
// @updateURL    https://raw.githubusercontent.com/mobile-games-exchange/tampermonkey-scripts/main/CeXSellBasketTransfer.user.js
// ==/UserScript==


(function () {
    'use strict';
    // Function to be executed when the target node is added
    // Options for the observer (which mutations to observe)
    // Function to check for the presence of the checkout container

    function checkCheckoutContainer() {
        const checkoutContainer = document.querySelector('.checkout-container');
        if (checkoutContainer) {
            // Found the checkout container, do something here
            console.log('Checkout container is now present:', checkoutContainer);
            clearInterval(checkInterval); // Stop the interval once the target is found
            checkImageCardsInterval = setInterval(checkImages, 500);
        }
    }

    function checkImages() {
        const imageCards = document.querySelectorAll('.card-img');
        if (imageCards) {
            // Found the checkout container, do something here
            console.log('Image containers are now present:', imageCards);
            clearInterval(checkImageCardsInterval); // Stop the interval once the target is found
            getProductID();
        }
    }
    // Function to extract product ID from the anchor element
    function getProductID() {
        const imageContainers = document.querySelectorAll('.card-img');
        if (imageContainers.length > 0) {
            imageContainers.forEach(container => {
                const anchor = container.querySelector('a');
                if (anchor) {
                    const href = anchor.getAttribute('href');
                    const urlParams = new URLSearchParams(href.split('?')[1]);
                    const productId = urlParams.get('id');
                    if (productId) {
                        console.log('Product ID:', productId);
                        productIds.push(productId);
                    } else {
                        console.log('Product ID not found.');
                    }
                }
            });
        } else {
            console.log('No image containers found.');
        }

        if (productIds.length > 0) {
            createButton();

        }
        else {
            alert("No products found for some reason!");
        }
    }

    function createButton() {
        var btnSelect = document.getElementById('toolkit-transfer-btn');
        if (btnSelect) {
            btnSelect.remove(); // Remove the existing button if present
        }

        sendDataButton = document.createElement('button');
        sendDataButton.textContent = 'Send product to pricing system';
        sendDataButton.className = "cx-btn cx-btn-md cx-btn-white";
        sendDataButton.id = "toolkit-transfer-btn";
        sendDataButton.addEventListener('click', function () {
            sendDataButton.textContext = 'Fetching data and sending data to pricing system...';
            FetchProductDetailsAndSend();
        });


        // Find the div with class "price-block"
        var referenceNode = document.querySelector('.order-summary-inner');
        if (referenceNode) {
            referenceNode.append(sendDataButton);
        } else {
            console.error('Price block not found');
        }
    }

    async function FetchProductDetailsAndSend() {

        sendDataButton.textContent = 'Processing data to send...';
        console.log("product ids: " + productIds);
        // Fetch details for each product ID
        for (const productId of productIds) {
            try {
                const response = await fetch(`https://wss2.cex.uk.webuy.io/v3/boxes/${productId}/detail`);
                if (response.ok) {
                    const data = await response.json();
                    console.log(data);
                    const newTPI = new TPI(data.response.data.boxDetails[0].boxName, data.response.data.boxDetails[0].categoryFriendlyName, data.response.data.boxDetails[0].sellPrice, data.response.data.boxDetails[0].cashPrice, data.response.data.boxDetails[0].exchangePrice, data.response.data.boxDetails[0].boxId);
                    //const tempProduct = new TPI(name, category, sell, cash, trade, id);
                    tempProductList.push(newTPI);
                } else {
                    console.error(`Failed to fetch product details for ID: ${productId}`);
                }
            } catch (error) {
                console.error(`Error fetching product details for ID: ${productId}`, error);
            }
        }

        fetch(key_variables.api_sendSellBasketProductsURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tempProductList)
        })
            .then(response => {
                if (response.ok) {
                    sendDataButton.textContent = 'Product(s) sent!';
                    console.log('POST request successful');
                } else {
                    sendDataButton.textContent = 'Error sending product!!!';
                    console.error('POST request failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }


    // Get all image URLs inside the checkout container
    const productIds = [];
    const tempProductList = [];
    // Interval for checking the presence of the checkout container (every 500 milliseconds)
    const checkInterval = setInterval(checkCheckoutContainer, 500);
    var checkImageCardsInterval = 0;
    var sendDataButton = document.createElement('button');

    class TPI {
        constructor(name, category, sell, cash, trade, id) {
            this.TPI_ProductName = name;
            this.TPI_ProductCategoryName = category;
            this.TPI_SellPrice = sell;
            this.TPI_CashPrice = cash;
            this.TPI_TradePrice = trade;
            this.TPI_WeBuyId = id;
        }
    }

})();