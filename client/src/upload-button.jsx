import React, {PureComponent} from 'react';
import {Button} from 'reactstrap';

class UploadButton extends PureComponent{
	fileInputRef = React.createRef();

	handleClick = () => {
		this.fileInputRef.current.click();
	}

	render(){
		const {children, loading} = this.props;

		return(
			<div>
				<input
					ref={this.fileInputRef}
					accept="image/*"
					style={{display:'none'}}
					type="file"
					onChange={this.props.Upload}
				/>
				<Button
					color="primary"
					disabled={loading}
					onClick={this.handleClick}
				>
					{children}
				</Button>
			</div>
		)
	}
}
export default UploadButton;