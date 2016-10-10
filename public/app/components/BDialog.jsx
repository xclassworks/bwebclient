import React from 'react';

export default class BDialog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            message:    null,
            inputValue: '',
            display:    'block'
        };

        this.buttonClick = props.buttonClick;
        this.inputPlaceHolder = 'Robot token';
        this.buttonText = 'Find robot';
        this.title =    'Please insert the robot token to start talk';
    }

    render() {
        return (
            <section className="token-container" style={ { display: this.state.display } }>
                <div className="find-robot">
                    <h3>{ this.title }</h3>
                    <div className="message">{ this.state.message }</div>
                    <input type="text" value={this.state.inputValue}
                        placeholder={ this.inputPlaceHolder }
                        onChange={ this.onChangeInputText.bind(this) } />
                    <button type="button" onClick={ this.onClickButton.bind(this) }>
                        { this.buttonText }
                    </button>
                </div>
            </section>
        );
    }

    onChangeInputText(event) {
        this.setState({ inputValue: event.target.value });
    }

    onClickButton(event) {
        console.log(this.state.inputValue);

        this.buttonClick.call(this);
    }
}
