'use strict';

(function () {
    var robotToken = getRobotToken();

    if (robotToken) {
        launchApp();
    } else {
        var findRobotBtn = document.querySelector('button[name="findRobot"]');
        var inputRobotToken = document.querySelector('input[name="robotToken"]');

        findRobotBtn.addEventListener('click', function () {

            if (inputRobotToken.value == '123') {
                setRobotToken(inputRobotToken.value);
                launchApp();
            }
        });
    }

    // Functions
    function getRobotToken() {
        return localStorage.getItem('robotToken');
    }

    function setRobotToken(robotToken) {
        return localStorage.setItem('robotToken', robotToken);
    }

    function openUserCamera() {
        navigator.getUserMedia = (navigator.getUserMedia
            || navigator.webkitGetUserMedia
            || navigator.mozGetUserMedia
            || navigator.msgGetUserMedia);

        if (navigator.getUserMedia) {
            console.log('[OK] Your browser supports the video feature o/');

            navigator.getUserMedia(
                { video: true, audio: false },
                function (stream) {
                    var videoElem = document.querySelector('video#stage');
                    var videoMirror = document.querySelector("video#mirror");

                    videoElem.src = window.URL.createObjectURL(stream);
                    videoMirror.src = window.URL.createObjectURL(stream);
                },
                function (err) {
                    console.error(err);
                });
        } else {
            console.warn('[FAIL] Your browser does not support the video feature');
        }
    }

    function releaseAppContainer() {
        var tokenCtn = document.querySelector('.token-container');
        var appCtn = document.querySelector('.app-container');

        document.body.removeChild(tokenCtn);

        appCtn.className = appCtn.className.replace('mask', '');
    }

    function initAppEvents() {

        // Auxiliar functions
        function _isKeyPressed(element) {

            if (element.className.indexOf('active') > -1) {
                return true;
            }

            return false;
        }

        function _searchElement(keyCode) {

            switch (keyCode) {
                case 87: //w
                    return cameraJoystick.foward;
                    break;
                case 65: //a
                    return cameraJoystick.left;
                    break;
                case 68: //d
                    return cameraJoystick.right;
                    break;
                case 83: //s
                    return cameraJoystick.back;
                    break;
                case 38: // arrow up
                    return movimentJoystick.foward;
                    break;
                case 37: // arrow left
                    return movimentJoystick.left;
                    break;
                case 39: // arrow right
                    return movimentJoystick.right;
                    break;
                case 40: //arrow down
                    return movimentJoystick.back;
                    break;
            }
        }

        // Keypress events to move the robot
        var cameraJoystick = {
            foward: document.querySelector('.camera-joystick i[type="foward"]'),
            back: document.querySelector('.camera-joystick i[type="back"]'),
            left: document.querySelector('.camera-joystick i[type="left"]'),
            right: document.querySelector('.camera-joystick i[type="right"]')
        };

        var movimentJoystick = {
            foward: document.querySelector('.moviment-joystick i[type="foward"]'),
            back: document.querySelector('.moviment-joystick i[type="back"]'),
            left: document.querySelector('.moviment-joystick i[type="left"]'),
            right: document.querySelector('.moviment-joystick i[type="right"]')
        };

        document.onkeydown = function (evt) {
            var element = _searchElement(evt.keyCode);

            if (element && !_isKeyPressed(element)) {
                element.className = element.className.concat(' active');
            }
        };

        document.onkeyup = function (evt) {
            var element = _searchElement(evt.keyCode);

            if (element) {
                element.className = 'material-icons';
            }
        };
    }

    function launchApp() {
        releaseAppContainer();
        openUserCamera();
        initAppEvents();
    }
})();
