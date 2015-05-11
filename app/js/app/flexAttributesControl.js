angular.module('flexAttributesManagement', [ 'ngRoute', 'ngMessages', 'ngAnimate', 'mobile-angular-ui', 'ngScrollSpy' ]).controller('MainController', function($rootScope, $scope, $http, $animate, $timeout, SharedState, ScrollSpy) {
	$scope.date = new Date();
	$scope.predicate = null;
	$scope.locales = [];
	$scope.currentAttribute = '';
	/* Select Attribute - orderBy */
	$scope.attributeName = "attributeName";
	/* Attribute Restricted Values - orderBy */
	$scope.restrictedVal = "restrictedValues";
	$scope.system = {
		messages : {
			loading : false,
			saving : false,
			unassociatedAttributes : false,
			unassociatedValues : false,
			ajaxStatus : false,
			canClear : false,
			notClear : false,
			canCancel : false,
			notCancel : false
		},
		dynamicMessage : '',
		canClearMessage : '',
		notClearMessage : '',
		canCancelMessage : '',
		notCancelMessage : ''
	};

	$scope.init = function(data) {
		/* Validate All of Values */
		angular.forEach(data.mAttributeValueMap, function(attr, attrID) {
			if (attr.type === 'numerical') {
				if (attr.value) {
					attr.value = Number(attr.value);
				}
				if (product.product.attributeValues[attrID]) {
					product.product.attributeValues[attrID].value = Number(product.product.attributeValues[attrID].value);
				}
			}
		});

		$scope.product = {
			id : data.mProductId,
			name : data.mProductName,
			typeId : data.mProductTypeId,
			typeName : data.mProductTypeName
		};
		$scope.attributeGroups = data.mGroupList;
		$scope.attributeValues = data.mAttributeValueMap;
		$scope.unAttributeGroup = data.mUnassociatedAttributeGroup;
		$scope.unValueGroup = data.mUnassociatedValueGroup;
		data = null;
	};

	$scope.saveProduct = function(closeWindow) {
		var jqSavingForm = angular.element(document.getElementById("#saveProductAttributes"));
		var product = $scope.product;
		var countErrors = 0;

		if (jqSavingForm.data('inProgress') === true) {
			popMessage('Please wait for seconds.');
			return;
		}
		if (angular.element(saveProductForm).hasClass('ng-invalid') || countErrors > 0) {
			// popMessage($scope.messages.missed(countErrors));
			return;
		}
		// saving form
		$scope.system.messages.loading = true;
		$http.post('inprogress.jsp', {
			p : angular.toJson(product, false)
		}).success(function(data, status, headers, config) {
			if (closeWindow) {
				window.close();
			} else {
				$scope.init(data);
				SharedState.set('groupTabs', $scope.product.attributeGroups[0]);
			}
			$scope.system.messages.loading = false;
		}).error(function(data, status, headers, config) {

		});
	};

	$scope.addAttribute = function() {
		// group.attributes.push(attribute);
	};

	$scope.editValues = function() {
		var jQValuesSelected = angular.element(document.getElementsByName('valueSelected'));
		var data = {
			attributeValueInputs : new Array()
		};

		angular.forEach(jQValuesSelected, function(element, index) {
			var jQThis = angular.element(element);
			if (jQThis.prop('checked')) {
				data.attributeValueInputs.push({
					productId : $scope.product.id,
					attributeId : $scope.currentAttribute.mId,
					attributeValueId : jQThis.val()
				});
			}
		});

		angular.element(document.getElementById('attrValueIds')).val(angular.toJson(data));
		var formD = assembleFormData(document.getElementById('saveValueForm'));

		$http({
			url : formD.url,
			params : formD.formData
		}).success(function(data, status, headers, config) {
			reloadAllData(function() {
				SharedState.turnOff('editValuesPanel');
			});
		}).error(function(data, status, headers, config) {

		});
	}

	$scope.clearValues = function(attribute) {
		if (attribute.mIsGray) {
			return;
		}
		var isRequired = attribute.mRequired;
		if (isRequired == true) {
			$scope.system.notClearMessage = "The attribute value can’t be cleared. Because the attribute is required.";
			SharedState.turnOn('SureDialog');
		} else {
			$scope.system.messages.canClear = true;
			$scope.system.messages.canCancel = false;
			$scope.system.messages.notCancel = false;
			$scope.system.canClearMessage = "You’d like to  delete the attribute values.";
			SharedState.turnOn('ConfirmDialog');
		}
		$scope.currentAttribute = attribute;
	};

	function passAjaxRequst(attribute) {
		var data = {
			attributeId : attribute.mId,
			productId : $scope.product.id,
			valueInfos : new Array()
		};
		angular.forEach(attribute.mValueIds, function(valueID, index) {
			var valueId = attribute.mValueIds[index];
			var isDefault = "";
			for (var i = 0; i < $scope.attributeValues[attribute.mKey].length; i++) {
				if ($scope.attributeValues[attribute.mKey][i].mValueId == valueId) {
					isDefault = $scope.attributeValues[attribute.mKey][i].mDefault;
					break;
				}
			}
			valueInfo = {
				valueId : attribute.mValueIds[index],
				isDefault : isDefault
			}
			data.valueInfos.push(valueInfo);
		});
		if (window.JSON.stringify) {
			angular.element(document.getElementById('values')).val(JSON.stringify(data));
		}
		var formD = assembleFormData(document.getElementById('clearValueForm'));
		$http({
			url : formD.url,
			params : formD.formData
		}).success(function(data, status, headers, config) {
			if (data.error) {
				/*
				 * $scope.system.notClearOrCancelMessage = data.error;
				 * SharedState.turnOn('SureDialog');
				 */
				$scope.system.messages.ajaxStatus = true;
				$scope.system.dynamicMessage = data.error;
			}
			if (data.success) {
				// attribute.mValueIds.length = 0;
				var values = JSON.parse(data.success);
				$scope.attributeValues[attribute.mKey] = values;
				attribute.mIsGray = true;
			}
		}).error(function(data, status, headers, config) {

		});
	}

	$scope.addGroup = function(group) {
		if (group) {
			$scope.product.attributeGroups.push(group);
		}
	};

	$scope.editValue = function(id, value) {
		SharedState.turnOn('modelEditValue');
	};

	$scope.removeGroup = function(group) {
		// $scope.attributeGroups.push(group);
	};

	$scope.openEditValuesPanel = function($event, attr) {
		$http.post('/dynamicAttributes/jsp/component/attributeValues.jsp?attributeId=' + attr.mId, {}).success(function(data, status, headers, config) {
			$scope.valueList = data;
		}).error(function(data, status, headers, config) {

		});
		SharedState.turnOn('editValuesPanel');
		$scope.currentAttribute = attr;
	}

	/* Events */
	ScrollSpy.onOverscrollVert(function(ScrollData, ScrollDelta) {
		var editValuesPanel = document.getElementById('editValuesPanel');
		var eastPanel = document.getElementsByClassName('eastPanel')[0];
		var jQSubNavbar = angular.element(document.getElementById('subNavbar'));
		var listHeader = angular.element(document.getElementById('listHeader'));

		if (ScrollData.posY <= 60) {
			editValuesPanel.style.height = ScrollData.height - 104 + 'px';
			listHeader.removeClass("affix");
		} else {
			if (eastPanel.offsetHeight < ScrollData.height - 75) {
				eastPanel.style.height = ScrollData.height - 75 + 'px';
			}
			editValuesPanel.style.height = ScrollData.height - 44 + 'px';
		}

		if (ScrollData.posY <= 104) {
			listHeader.removeClass("affix");
		} else {
			listHeader.addClass("affix");
		}
	})
	ScrollSpy.trigger();

	$scope.$on('mobile-angular-ui.state.changed.editValuesPanel', function(e, newVal, oldVal) {
		var listHeader = document.getElementsByClassName('table-header')[0];
		var editValuesPanel = document.getElementById('editValuesPanel');
		var evpCS = window.getComputedStyle(editValuesPanel);

		if (newVal === true) {
			listHeader.style.width = listHeader.parentNode.offsetWidth - parseInt(evpCS.width, 10) + 'px';
		} else {
			listHeader.style.width = listHeader.parentNode.offsetWidth + parseInt(evpCS.width, 10) + 'px';
			$scope.currentAttribute = '';
		}
	});

	$scope.$on('mobile-angular-ui.state.changed.groupTabs', function(e, newVal, oldVal) {
		SharedState.turnOff('editValuesPanel');
		SharedState.set('groupTabs', newVal);
		if (newVal == $scope.unAttributeGroup.mId) {
			$scope.currentGroup = $scope.unAttributeGroup.mDisplayName + ' (' + $scope.unAttributeGroup.mAttributeList.length + ')';
			$scope.system.messages.unassociatedAttributes = true;
			$scope.system.messages.unassociatedValues = false;

			return true;
		} else if (newVal == $scope.unValueGroup.mId) {
			$scope.currentGroup = $scope.unValueGroup.mDisplayName + ' (' + Object.keys($scope.unValueGroup.mValues).length + ')';
			$scope.system.messages.unassociatedAttributes = false;
			$scope.system.messages.unassociatedValues = true;

			return true;
		}
		for ( var index in $scope.attributeGroups) {
			$scope.system.messages.unassociatedAttributes = false;
			$scope.system.messages.unassociatedValues = false;
			if (newVal == $scope.attributeGroups[index].mId) {
				$scope.currentGroup = $scope.attributeGroups[index].mDisplayName + ' (' + $scope.attributeGroups[index].mAttributeList.length + ')';

				break;
			}
		}

		$timeout(panelBalance, 500);
	});

	$scope.addLanguage = function() {
		var existed = false;
		console.log($scope.sLanguage);
		if (!$scope.sLanguage) {
			// popMessage('Please select a language.');
			console.log('Please select a language.');

			return;
		}
		angular.forEach($scope.locales, function(langB, alBIndex) {
			if (langB.language == $scope.sLanguage) {
				existed = true;

				return false;
			}
		});
		if (!existed) {
			$scope.locales.push({
				language : $scope.sLanguage,
				value : ""
			});
			$scope.sLanguage = '';
		} else {
			popMessage('There is one.');
		}
	}

	$scope.updateValueList = function($event) {
		$http.post('valueList.jsp', {
			p : angular.toJson("", false)
		}).success(function(data, status, headers, config) {
			$scope.valueList = data;
		}).error(function(data, status, headers, config) {

		});
	};

	$scope.toggleCollapse = function($event) {
		var jEToggle = angular.element($event.target);
		var jECollapse = jEToggle.parent().parent().next();
		var jQsubHeader = angular.element(document.getElementById('subHeader'));
		var eastPanel = document.getElementsByClassName('eastPanel')[0];

		if (jECollapse.hasClass('in')) {
			$animate.animate(jECollapse, {
				height : 'auto'
			}, {
				height : 0
			}).then(function() {
				jECollapse.removeClass('in');
				jEToggle.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-right');
				panelBalance();
			});
		} else {
			$animate.animate(jECollapse, {
				height : 0
			}, {
				height : 'auto'
			}, 'collapsing').then(function() {
				jECollapse.addClass('in');
				jEToggle.removeClass('glyphicon-chevron-right').addClass('glyphicon-chevron-down');
				panelBalance();
				if (!jQsubHeader.hasClass('affix')) {
					editValuesPanel.style.height = window.height - 104 + 'px';
				} else {
					if (eastPanel.offsetHeight < window.height - 75) {
						eastPanel.style.height = window.height - 75 + 'px';
					}
				}
			});
		}
	}

	$scope.cancel = function() {
		var callbackWhenCancel = function() {
			if (findContainError()) {
				$scope.system.messages.notCancel = true;
				$scope.system.messages.canCancel = false;
				$scope.system.messages.canClear = false;
				$scope.system.notCancelMessage = "Some attributes are required. You’d like to update attribute value.";
				SharedState.turnOn('ConfirmDialog');
			} else {
				$scope.system.messages.canCancel = true;
				$scope.system.messages.notCancel = false;
				$scope.system.messages.canClear = false;
				$scope.system.canCancelMessage = "You’d like to close the current page.";
				SharedState.turnOn('ConfirmDialog');
			}
		}

		reloadAllData(callbackWhenCancel);
	}

	/**
	 * find is contain any error on the retrieved data.
	 * 
	 */
	function findContainError() {
		var containError = false;
		for (var i = 0, len = $scope.attributeGroups.length; i < len; i++) {
			var currentAttributes = $scope.attributeGroups[i].mAttributeList;
			for (var j = 0, lenInner = currentAttributes.length; j < lenInner; j++) {
				if (currentAttributes[j].mHasError) {
					containError = true;
					return containError;
				}
			}
		}
		return containError;
	}

	/**
	 * This function will retrieve all data from back end.
	 * 
	 */
	function reloadAllData(callback) {
		$http({
			url : '/dynamicAttributes/jsp/component/versionDatas.jsp',
			params : {
				assetId : $scope.product.id
			}
		}).success(function(data, status, headers, config) {
			$scope.init(data);
			if (angular.isFunction(callback)) {
				callback(data, status, headers, config);
			}
		}).error(function(data, status, headers, config) {

		});
	}

	window.onbeforeunload = function(event) {
		var msg = "";
		event.returnValue = msg;
		return msg;

	}

	$scope.revert = function() {
		location.reload();
	}

	if ((typeof versionedViewData).toLowerCase() === 'undefined') {
		return;
	}
	// ************************************************************
	// Define Button Event
	// ************************************************************
	$scope.btnSelectAll = function() {
		var jQValuesSelected = angular.element(document.getElementsByName('valueSelected'));
		angular.forEach(jQValuesSelected, function(element, index) {
			var jQThis = angular.element(element);
			if (!jQThis.prop('checked')) {
				jQThis.prop('checked', true);
			}
		});
	}

	$scope.btnUnSelectAll = function() {
		var jQValuesSelected = angular.element(document.getElementsByName('valueSelected'));
		angular.forEach(jQValuesSelected, function(element, index) {
			var jQThis = angular.element(element);
			if (jQThis.prop('checked')) {
				jQThis.prop('checked', false);
			}
		});
	}

	$scope.dialogBtnYes = function() {
		if ($scope.system.messages.canCancel) {
			window.close();
		} else if ($scope.system.messages.notCancel) {
		} else {
			var attribute = $scope.currentAttribute;
			passAjaxRequst(attribute);
		}
	}

	$scope.dialogBtnNo = function() {
		if ($scope.system.messages.notCancel) {
			window.close();
		}
	}

	$scope.init(versionedViewData);
}).filter("startWith", function() {
	return function(value, index) {
		if (index == undefined || index == "") {
			return value;
		}
		return value.filter(function(item) {
			return (item.mValue.indexOf(index) != -1);
		});
	}
});

angular.element(document).ready(function() {
	angular.element(window).bind('resize', function(event) {
		var listHeader = document.getElementById('listHeader');
		var listFrame = listHeader.parentElement, listContent = document.getElementById('listContent');
		var eastPanel = document.getElementsByClassName('eastPanel')[0];
		var editValuesPanel = document.getElementById('editValuesPanel');

		listHeader.children[0].style.width = listFrame.offsetWidth + 'px';
		eastPanel.style.width = eastPanel.parentElement.offsetWidth - 30 + 'px';

		// adjust the height of right popup panel
		if (angular.element(listHeader).hasClass("affix")) {
			editValuesPanel.style.height = window.innerHeight - 40 + 'px';
		} else {
			editValuesPanel.style.height = window.innerHeight - 104 + 'px';
		}
		panelBalance(listFrame, listContent, eastPanel);
	}).triggerHandler('resize');
});

function panelBalance(listFrame, listContent, eastPanel) {
	if (!listFrame) {
		listFrame = document.getElementById('listHeader').parentElement;
	}
	if (!listContent) {
		listContent = document.getElementById('listContent');
	}
	if (!eastPanel) {
		eastPanel = document.getElementsByClassName('eastPanel')[0];
	}
	if (listContent) {
		if (listContent.offsetHeight < eastPanel.offsetHeight - 40) {
			listFrame.style.minHeight = eastPanel.offsetHeight + 'px';
		} else {
			listFrame.style.minHeight = 'initial';
		}
	}
}

function assembleFormData(form) {
	var data = {};

	angular.forEach(angular.element(form).find('input'), function(input, index) {
		var thisInput = angular.element(input);

		data[thisInput.attr('name')] = thisInput.val();
	});

	return {
		url : angular.element(form).attr('action'),
		formData : data
	}
}