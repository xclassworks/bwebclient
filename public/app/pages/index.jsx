import React from 'react';
import ReactDOM from 'react-dom';
import BHeader from '../components/BHeader';

class IndexPage extends React.Component {
    render() {
        return (
            <div>
                <BHeader />
                <div>
                    <i className="material-icons big-icon">voice_chat</i>
                    <h1 className="centralized-text">
                        A robot to cut the distance and put you close with who cares the most
                    </h1>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<IndexPage />, document.getElementById('bmate-app'));
