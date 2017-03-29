/*
 *
 * Messages
 *
 */
/* eslint no-underscore-dangle: 1 */


import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import {
  selectPersonSelector,
  selectMatches,
  selectMatchDetailImages,
  selectMatchMessages,
  selectOptimisticUI,
  selectIsAllFetched,
  selectIsFetching,
  selectNewNotifications,
} from './selectors';

import {
  selectTargetGender,
  selectUserID,
} from 'containers/Dashboard/selectors';

import { createStructuredSelector } from 'reselect';

import {
  selectPersonAction,
  sendMessage,
  fetchMatchData,
  fetchMatchDataLocally,
  dumpAllInit,
} from './actions';

import messages from './messages';
import { FormattedMessage } from 'react-intl';

import MessengerCard from 'components/MessengerCard';
import DetailView from 'components/DetailView';
import Panel from 'components/Panel';
import MessageBubble from 'components/MessageBubble';
import MessengerInput from 'components/MessengerInput';
import Text from 'components/Text';
import Infinite from 'react-infinite';
import conversationPlaceholder from 'static/conversation.png';
import styles from './styles.css';

export class Messages extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor() {
    super();
    this.state = { filter: 'normal', sort: 'normal' };
  }
  componentWillMount() {
    this.props.fetchHistoryLocally();
  }

  componentDidUpdate() {
    if (this.matchMessageContainer) {
      this.matchMessageContainer.scrollTop = this.matchMessageContainer.scrollHeight;
    }
  }

  componentWillUnmount() {
    this.props.dumpAll();
  }

  mapMatches() {
    return this.props.selectMatches && this.props.selectMatches
    .filter(m => {
      const match = m;
      switch (this.state.filter) {
        case 'nomessage':
          // if empty messages or if there are no messages from me
          return match.messages.length === 0;
        case 'ineedtoreply': {
          const lastMessage = match.messages[match.messages.length - 1];
          return lastMessage && match._id.indexOf(lastMessage.to) !== 0;
        }
        case 'theyhaventresponded': {
          // is the last message from me?
          const lastMessage = match.messages[match.messages.length - 1];
          return lastMessage && match._id.indexOf(lastMessage.to) === 0;
        }
        default:
          return true;
      }
    })
    /* eslint-disable no-nested-ternary */
    .sort((a, b) => {
      switch (this.state.sort) {
        case 'mostmessage':
          return b.messages.length - a.messages.length;
        case 'leastmessage':
          return a.messages.length - b.messages.length;
        case 'oldest':
          return new Date(a.last_activity_date) - new Date(b.last_activity_date);
        default:
          return new Date(b.last_activity_date) - new Date(a.last_activity_date);
      }
    })
    .map((each) => {
      return (<MessengerCard
        onClick={this.props.selectPerson}
        key={each._id}
        data={each}
        isReply={each.messages.length !== 0 && each.messages.slice(-1)[0].from === this.props.currentUserId}
        isNew={each.person && each.person._id && this.props.newMatches.indexOf(each.person._id) !== -1}
      />);
    });
  }

  mapMessages() {
    return this.props.matchMessages.map((each) => {
      return (<MessageBubble
        key={each.payload._id}
        from={each.from}
        date={each.payload.sent_date}
      >
        {each.payload.message}
      </MessageBubble>);
    })
    .concat(this.props.selectOptimistic.map((each) => {
      if (each.id === this.props.currentPerson.id) {
        return (<MessageBubble
        key={each.message}
        from="you">
          {each.message}
        </MessageBubble>);
      }
    }));
  }

  renderPlaceholderMessage() {
    if (this.props.isDataFetching) {
      return <FormattedMessage {...messages.whenLoadingData} />;
    }
    if (this.props.selectMatches) {
      return <FormattedMessage {...messages.whenLoadedData} />;
    }
    return <FormattedMessage {...messages.whenNoDataisFound} />;
  }

  render() {
    const mappedMatches = this.mapMatches();
    window.mappedMatches = mappedMatches;
    return (
      <div className={styles.messagesContainer}>
        <div className={styles.messagePanel}>
          <div className={styles.messageFiltersContainer}>
            <select onChange={(event) => this.setState({ filter: event.target.value })}>
              <option value="normal">Filter by</option>
              <option value="ineedtoreply">I need to reply</option>
              <option value="theyhaventresponded">They haven't responded</option>
              <option value="nomessage">No messages</option>
            </select>
            <select onChange={(event) => this.setState({ sort: event.target.value })}>
              <option value="normal">Sort by</option>
              <option value="mostmessage">Most messages</option>
              <option value="leastmessage">Least messages</option>
              <option value="neweset">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <small>{mappedMatches ? mappedMatches.length : 0}</small>
          </div>
          <Infinite
            className={styles.messagePanelContainer}
            containerHeight={800}
            elementHeight={100}
            itemsPerRow={1}
          >
          {this.props.selectMatches && mappedMatches}
          </Infinite>
        </div>
        <div className={styles.messengerPanel}>
          <div className={styles.messengerPanelContainer}>
            <div className={styles.horizontalMessengerPanel}>
              <div className={styles.columnMessengerPanel} id="messengerPanelContainer">
                {this.props.currentPerson && this.props.matchMessages ?
                  <div
                    className={styles.messagesPanel}
                    ref={(thisComponent) => { this.matchMessageContainer = thisComponent; }}
                  >
                    {this.mapMessages()}
                  </div>
                  :
                  <div className={styles.messagesPanel} style={{ justifyContent: 'flex-end' }}>
                    <Text
                      type="matchName"
                      style={{ justifyContent: 'center', flexDirection: 'column' }}
                    >
                      <img src={conversationPlaceholder} className={styles.conversationPlaceholderImage} role="presentation" />
                      {this.renderPlaceholderMessage()}
                    </Text>
                  </div>
                }
                <div className={styles.chatBoxPanel}>
                  <MessengerInput
                    sendTo={this.props.currentPerson && this.props.currentPerson._id}
                    sendToName={this.props.currentPerson && this.props.currentPerson.person.name}
                    sendMessage={this.props.onSendMessage}
                    disabled={!this.props.currentPerson}
                  />
                </div>
              </div>
              <div className={styles.profileBioPanel} >
                {this.props.currentPerson && this.props.matchDetailImages ?
                  <DetailView
                    data={this.props.currentPerson.person}
                    imageData={this.props.matchDetailImages}
                  /> :
                  <Panel hasMatches targetGender={this.props.targetGender} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    selectPerson: (id) => dispatch(selectPersonAction(id)),
    onSendMessage: (id, message) => dispatch(sendMessage(id, message)),
    fetchHistory: () => dispatch(fetchMatchData()),
    fetchHistoryLocally: () => dispatch(fetchMatchDataLocally()),
    dumpAll: () => dispatch(dumpAllInit()),
  };
}

const mapStateToProps = createStructuredSelector({
  currentPerson: selectPersonSelector(),
  selectMatches: selectMatches(),
  matchDetailImages: selectMatchDetailImages(),
  matchMessages: selectMatchMessages(),
  selectOptimistic: selectOptimisticUI(),
  isAllDataFetched: selectIsAllFetched(),
  isDataFetching: selectIsFetching(),
  newMatches: selectNewNotifications(),
  targetGender: selectTargetGender(),
  currentUserId: selectUserID(),
});

Messages.propTypes = {
  selectMatches: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.array,
  ]),
  currentUserId: PropTypes.string,
  selectPerson: PropTypes.func,
  currentPerson: PropTypes.object,
  matchMessages: PropTypes.array,
  matchDetailImages: PropTypes.array,
  onSendMessage: PropTypes.func,
  fetchHistory: PropTypes.func,
  selectOptimisticUI: PropTypes.func,
  selectOptimistic: PropTypes.array,
  isAllDataFetched: PropTypes.bool,
  isDataFetching: PropTypes.bool,
  fetchHistoryLocally: PropTypes.func,
  dumpAll: PropTypes.func,
  newMatches: PropTypes.array,
  targetGender: PropTypes.number,
};

export default connect(mapStateToProps, mapDispatchToProps)(Messages);
