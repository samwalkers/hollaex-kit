import React, { Component } from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import ReactSVG from 'react-svg';
import { DisplayTable } from '../../../components';
import { formatTimestamp } from '../../../utils/utils';
import STRINGS from '../../../config/localizedStrings';
import { IS_HEX, ICONS } from '../../../config/constants';

const generateHeaders = () => {
	return [
		{
			key: 'price',
			label: STRINGS.PRICE,
			renderCell: ({ side, price = 0, isSameBefore, upDownRate }, index) => {
				const isArrow = upDownRate < 0;
				return (
					<div
						className={classnames('trade_history-row d-flex flex-row', side)}
						key={`time-${index}`}
					>
						{!isSameBefore
							? <ReactSVG
								path={isArrow
									? ICONS.DOWN_ARROW
									: ICONS.UP_ARROW
								}
								wrapperClassName={
									classnames('trade_history-icon', side)
								}
							/>
							: <div className='trade_history-icon' />
						}
						{price}
					</div>
				)
			}
		},
		{
			key: 'size',
			label: STRINGS.SIZE,
			renderCell: ({ size = 0, side }, index) => IS_HEX
				? <div
					className={classnames('trade_history-row', side)}
					key={`size-${index}`}
				>
					{size}
				</div>
				: size
		},
		{
			key: 'timestamp',
			label: STRINGS.TIME,
			renderCell: ({ timestamp, side }, index) => IS_HEX
				? <div
					className={classnames('trade_history-row', side)}
					key={`timestamp-${index}`}
				>
					{formatTimestamp(timestamp, STRINGS.HOUR_FORMAT)}
				</div>
				: formatTimestamp(timestamp, STRINGS.HOUR_FORMAT)
		}
	];
}

class TradeHistory extends Component {
	state = {
		headers: [],
		data: [],
		isprevious: false
	};

	componentWillMount() {
		this.calculateHeaders();
		if (this.props.data.length) {
			this.generateData(this.props.data);
		}
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.language !== this.props.language) {
			this.calculateHeaders();
		}
	}

	componentDidUpdate(prevProps) {
		if (JSON.stringify(this.props.data) !== JSON.stringify(prevProps.data)) {
			this.generateData(this.props.data);
		}
	}

	calculateHeaders = () => {
		const headers = generateHeaders();
		this.setState({ headers });
	};

	generateData = (data) => {
		let constructedData = data.map((value, index) => {
			let temp = data[index - 1] ? data[index - 1] : {};
			let tempRate = data[index + 1] ? data[index + 1] : {};
			let isSameBefore = temp.price === value.price;
			let upDownRate = value.price - (tempRate.price || 0);
			return { ...value, isSameBefore, upDownRate };
		});
		this.setState({ data: constructedData });
	};

	render() {
		const { data } = this.state;
		return (
			<div className="flex-auto d-flex apply_rtl trade_history-wrapper">
				<DisplayTable headers={this.state.headers} data={data} />
			</div>
		);
	}
}

TradeHistory.defaultProps = {
	data: []
};

const mapStateToProps = (store) => ({
	pair: store.app.pair
});

export default connect(mapStateToProps)(TradeHistory);
