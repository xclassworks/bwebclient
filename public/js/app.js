'use strict';

(function () {
    // Glabla refference of socket
    var socket;
    
    // Attempt to get necessary configs for the app
    getJson('./bconfig/configs.json',
        initApp,
        function (status) {
            console.error('Error requesting app configuration. Http status', status);
        }
    );

    // Functions
    function initApp(CONFIGS) {
        var robotToken = getRobotToken();

        socket = io.connect('http://' + CONFIGS.socketServer.ipAddress + ':' + CONFIGS.socketServer.port);

        // Socket listeners
        socket.on('pairrobot:success', function (robot) {
            console.log('Robot found', robot);

            setRobotToken(robot.token);
            launchApp();
        });

        if (robotToken) {

            // Socket listeners
            socket.on('pairrobot:error', function (err) {
                console.error(err);

                enableInsertTokenDialog();
            });

            socket.emit('pairrobot', { token: robotToken });
        } else {
            enableInsertTokenDialog();
        }
    }

    function enableInsertTokenDialog() {
        var findRobotBtn = document.querySelector('button[name="findRobot"]');
        var inputRobotToken = document.querySelector('input[name="robotToken"]');
        var msgBox = document.querySelector('.find-robot .message');

        socket.on('pairrobot:error', function (err) {
            msgBox.innerHTML = err;
        });

        findRobotBtn.addEventListener('click', function () {

            if (inputRobotToken.value) {
                socket.emit('pairrobot', { token: inputRobotToken.value });
            }
        });
    }

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

                    // videoElem.src = window.URL.createObjectURL(stream);
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
            var moveInstructions = {
                moveType: null,
                direction: null
            };
            var element;

            switch (keyCode) {
                case 87: //w
                    element = cameraJoystick.foward;
                    moveInstructions.direction = 'FOWARD';
                    moveInstructions.moveType = 'CAMERA';
                    break;
                case 65: //a
                    element = cameraJoystick.left;
                    moveInstructions.direction = 'LEFT';
                    moveInstructions.moveType = 'CAMERA';
                    break;
                case 68: //d
                    element = cameraJoystick.right;
                    moveInstructions.direction = 'RIGHT';
                    moveInstructions.moveType = 'CAMERA';
                    break;
                case 83: //s
                    element = cameraJoystick.back;
                    moveInstructions.direction = 'BACK';
                    moveInstructions.moveType = 'CAMERA';
                    break;
                case 38: // arrow up
                    element = movimentJoystick.foward;
                    moveInstructions.direction = 'FOWARD';
                    moveInstructions.moveType = 'MOTOR';
                    break;
                case 37: // arrow left
                    element = movimentJoystick.left;
                    moveInstructions.direction = 'LEFT';
                    moveInstructions.moveType = 'MOTOR';
                    break;
                case 39: // arrow right
                    element = movimentJoystick.right;
                    moveInstructions.direction = 'RIGHT';
                    moveInstructions.moveType = 'MOTOR';
                    break;
                case 40: //arrow down
                    element = movimentJoystick.back;
                    moveInstructions.direction = 'BACK';
                    moveInstructions.moveType = 'MOTOR';
                    break;
            }

            return {
                elem: element,
                moveInstructions: moveInstructions
            };
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
            var instructions = _searchElement(evt.keyCode);
            var element = instructions.elem;

            if (element && !_isKeyPressed(element)) {
                element.className = element.className.concat(' active');

                socket.emit('robotmoverequest', instructions.moveInstructions);
            }
        };

        document.onkeyup = function (evt) {
            var instructions = _searchElement(evt.keyCode);
            var element = instructions.elem;

            if (element) {
                element.className = 'material-icons';

                socket.emit('robotstoprequest');
            }
        };
    }

    function launchApp() {
        releaseAppContainer();
        openUserCamera();
        initAppEvents();

        // Add listeners for the robot socket events
        socket.on('robotstream:data', function (evt) {
            console.log(evt.data);
        });

        socket.on('robotdisconnected', function () {
            location.reload();
        });
    }

    function getJson(url, successHandler, errorHandler) {
        var xhr = new XMLHttpRequest();

        xhr.open('get', url, true);
        
        xhr.onreadystatechange = function () {

            if (xhr.readyState == 4) {

                if (xhr.status == 200) {
                    var data = JSON.parse(xhr.responseText);
                    
                    invokeCallback(successHandler, [ data ]);
                } else {
                    invokeCallback(errorHandler, [ xhr.status ]);
                }
            }
        };

        xhr.send();
    }

    function invokeCallback(cb, paramsArray) {
        
        if (cb && typeof cb == 'function')
            cb.apply(this, paramsArray);
    }
})();
