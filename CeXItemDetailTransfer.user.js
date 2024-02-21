// ==UserScript==
// @name         MGX Toolkit - CeX Item Detail Transfer
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Custom script for webuy.com
// @author       Diogo Novo
// @match        https://uk.webuy.com/product-detail/*
// @include      https://uk.webuy.com/product-detail/*
// @grant        GM_setValue
// @grant        GM_getValue
// @require https://code.jquery.com/jquery-2.1.4.min.js
// @require C:\keys.js
// @downloadURL  https://raw.githubusercontent.com/mobile-games-exchange/tampermonkey-scripts/main/CeXItemDetailTransfer.user.js
// @updateURL    https://raw.githubusercontent.com/mobile-games-exchange/tampermonkey-scripts/main/CeXItemDetailTransfer.user.js
// ==/UserScript==

(function () {
    'use strict';

    var sendDataButton = document.createElement('button');
    var open = XMLHttpRequest.prototype.open;

    // Function to handle XHR responses
    function handleXHR(xhr) {
        // Check if the XHR response is the one you're looking for
        if (xhr && xhr.responseURL && xhr.responseURL.includes('detail') && xhr.responseURL.includes('boxes')) {
            // Store the intercepted JSON data
            GM_setValue('interceptedData', xhr.responseText);
            var responseData = JSON.parse(xhr.responseText);
            console.log('Parsed JSON:', responseData);
            setTimeout(function () {
                // function code goes here
                createButton()
            }, 3000);
        }
    }

    // Intercept XHR requests
    XMLHttpRequest.prototype.open = function () {
        this.addEventListener('load', function () {
            handleXHR(this);
        });
        open.apply(this, arguments);
    };

    // Function to send custom POST request
    function sendPostRequest(data) {
        sendDataButton.textContent = 'Sending data...';
        console.log("data: " + JSON.stringify(data));
        const newTPI = new TPI(data.response.data.boxDetails[0].boxName, data.response.data.boxDetails[0].categoryFriendlyName, data.response.data.boxDetails[0].sellPrice, data.response.data.boxDetails[0].cashPrice, data.response.data.boxDetails[0].exchangePrice, data.response.data.boxDetails[0].boxId);
        // Example: Send a POST request with the intercepted JSON data
        console.log("newTPI: " + JSON.stringify(newTPI));

        fetch(key_variables.api_sendSingleProductURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTPI)
        })
            .then(response => {
                if (response.ok) {
                    sendDataButton.textContent = 'Product sent!';
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

    // Create a button on the page
    function createButton() {
        var btnSelect = document.getElementById('toolkit-transfer-btn');
        if (btnSelect) {
            btnSelect.remove(); // Remove the existing button if present
        }

        sendDataButton = document.createElement('button');
        sendDataButton.textContent = 'Send product to pricing system';
        sendDataButton.className = "cx-btn cx-btn-md cx-btn-primary";
        sendDataButton.id = "toolkit-transfer-btn";
        sendDataButton.addEventListener('click', function () {
            // Retrieve the intercepted JSON data
            var interceptedData = GM_getValue('interceptedData');
            if (interceptedData) {
                // Send custom POST request with the intercepted data
                sendPostRequest(JSON.parse(interceptedData));
            } else {
                console.error('No intercepted data available');
            }
        });


        // Find the div with class "price-block"
        var referenceNode = document.querySelector('.add-to-cart-btn');
        if (referenceNode) {
            // Append the button to the end of the "price-block" div
            referenceNode.parentNode.insertBefore(sendDataButton, referenceNode.nextSibling);
        } else {
            referenceNode = document.querySelector('.notify-me-btn');
            if (referenceNode) {
                // Append the button to the end of the "price-block" div
                referenceNode.parentNode.insertBefore(sendDataButton, referenceNode.nextSibling);
            }
            else
            {
                console.error('Price block not found');
            }
            
        }
    }

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
