'use strict';

(function () {
    // Global reference of socket
    var socket;

    // Attempt to get necessary configs for the app
    getJson('/configs',
        initApp,
        function (status) {
            console.error('Error requesting app configuration. Http status', status);
        }
    );

    // Functions
    function initApp(CONFIGS) {
        var authToken = getAuthorizationToken();

        if (authToken) {
            var transportProtocol;

            if (CONFIGS.useSecureServer) {
                transportProtocol = 'https';
            } else {
                transportProtocol = 'http';
            }

            socket = io.connect(transportProtocol + '://' +
                                    CONFIGS.socketServer.address + ':' + CONFIGS.socketServer.port);

            // Socket listeners
            socket.on('join_robot_room:success', function (viewer) {
                console.log('Robot found', viewer);

                launchApp(CONFIGS, viewer.robot);
            });

            if (authToken) {

                // Socket listeners
                socket.on('join_robot_room:error', function (err) {
                    clearAuthToken();
                    redirectToNoBotPage();
                });

                socket.emit('join_robot_room', authToken, { name: 'Espectador fanático' });
            } else
                redirectToNoBotPage();

        } else
            redirectToNoBotPage();
    }

    function redirectToNoBotPage() {
        window.location = '../nobot';
    }

    function getAuthorizationToken() {
        var storagedToken = localStorage.getItem('robotToken');

        if (storagedToken)
            return storagedToken;

        var hash = location.hash;

        if (!hash || hash.indexOf('#join/') == -1)
            return;

        return hash.split('/')[1];
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

    function getAuthToken() {
        return localStorage.getItem('authToken');
    }

    function clearAuthToken() {
        localStorage.setItem('authToken', null);
    }

    function openUserCamera(pc) {
        navigator.getUserMedia = (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msgGetUserMedia);

        if (navigator.getUserMedia) {
            console.log('[OK] Your browser supports the video feature o/');

            navigator.getUserMedia(
                { video: true, audio: false },
                function (stream) {
                    var videoMirror = document.querySelector("video#mirror");

                    videoMirror.src = window.URL.createObjectURL(stream);

                    pc.addStream(stream);
                },
                function (err) {
                    console.error(err);
                });
        } else
            console.warn('[FAIL] Your browser does not support the video feature');
    }

    function releaseAppContainer() {
        // var tokenCtn = document.querySelector('.token-container');
        var appCtn = document.querySelector('.app-container');

        // document.body.removeChild(tokenCtn);

        appCtn.className = appCtn.className.replace('mask', '');
    }

    function initAppEvents() {

        // Auxiliar functions
        function _isKeyPressed(element) {

            if (element.className.indexOf('active') > -1)
                return true;

            return false;
        }

        function doAMoveRequest(moveInstruction) {
            socket.emit('robot_move_request', moveInstruction);
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
                case 37: // arrow left Gambeta
                    element = movimentJoystick.left;
                    moveInstructions.direction = 'RIGHT';
                    moveInstructions.moveType = 'MOTOR';
                    break;
                case 39: // arrow right Gambeta
                    element = movimentJoystick.right;
                    moveInstructions.direction = 'LEFT';
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

                doAMoveRequest(instructions.moveInstructions);
            }
        };

        document.onkeyup = function (evt) {
            var instructions = _searchElement(evt.keyCode);
            var element = instructions.elem;

            if (element) {
                element.className = 'material-icons';

                socket.emit('robot_stop_request');
            }
        };

        // Init Click events
        for (var command in movimentJoystick) {
            var buttonElement = movimentJoystick[command];
            var moveInstruction = {
                direction: command.toUpperCase(),
                moveType: 'MOTOR'
            };

            buttonElement.addEventListener('click', function () {
                doAMoveRequest(moveInstruction);
            });
        }

        // Detect faces button
        var detectFacesButton = document.querySelector('.detect-faces-btn');

        detectFacesButton.addEventListener('click', function () {

            if (detectFacesButton.className.indexOf(' active') > -1) {
                detectFacesButton.className = detectFacesButton.className.replace(' active', '');
                detectFacesButton.title = 'Detectar rostos';
            } else {
                detectFacesButton.className = detectFacesButton.className.concat(' active');
                detectFacesButton.title = 'Parar de detectar rostos';
            }
        });
    }

    function launchApp(CONFIGS, robot) {
        releaseAppContainer();
        initAppEvents();
        createPeerConnection(CONFIGS, robot);

        // Add listeners for the robot_disconnected socket event
        socket.on('robot_disconnected', function () {
            location.reload();
        });
    }

    function createPeerConnection(CONFIGS, robot) {
        var RTCPeerConn = RTCPeerConnection || webkitRTCPeerConnection;
        var pc = new RTCPeerConn(CONFIGS.webRTC);

        pc.onicecandidate = onIceCandidate;
        pc.onaddstream = onAddRemoteStream;
        pc.oniceconnectionstatechange = onIceConnectionStateChange;

        openUserCamera(pc);

        socket.on('signaling_message', handleSignalingMessages);
        socket.on('signaling_message:error', handleSignalingMessagesError);

        // Request offer to the robot
        socket.emit('signaling_message', { to: robot.id, type: 'request_offer' });

        function onIceCandidate(event) {

            if (event.candidate) {
                console.log('onIceCandidate', event.candidate);

                socket.emit('signaling_message', { type: 'candidate', candidate: event.candidate });
            }
        }

        function onAddRemoteStream(evt) {
            var remoteView = document.querySelector('video#stage');

            remoteView.src = URL.createObjectURL(evt.stream);
        }

        function onIceConnectionStateChange(event) {
            console.log('oniceconnectionstatechange status', pc.iceConnectionState);
        }

        // SignalingMessage handler functions

        function createAnswer(desc) {

            pc.setRemoteDescription(desc).then(
                function() {
                    console.log('Set remote description completed with success');

                    pc.createAnswer().then(
                        onCreateAnswerSuccess,
                        generalErrorHandler
                    );
                },
                generalErrorHandler
            );
        }

        function onCreateAnswerSuccess(desc) {

            pc.setLocalDescription(desc).then(
                function() {
                    console.log('Set local description completed with success');

                    socket.emit('signalingMessage', { type: 'offer', desc: desc });
                },
                generalErrorHandler
          );
        }

        function handleSignalingMessages(message) {

            console.log(message);

            switch (message.type) {
                case 'offer':
                    createAnswer(message.desc);
                    break;
                case 'candidate':
                    var candidate = new RTCIceCandidate(message.candidate);

                    pc.addIceCandidate(candidate).then(
                        function () {
                            console.log('Succes adding Ice candidate', candidate);
                        },
                        generalErrorHandler
                    );
                    break;
            }
        }

        function handleSignalingMessagesError(error) {
            console.error(error);
        }

        function generalErrorHandler(error) {
            console.error(error.toString());
        }
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
