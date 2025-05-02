/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/compounds.
 *
 * @grit/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { ErrorPage, Spinner } from "@grit/client-library/components";
import { useBatchProperties } from "../../../../../queries/batches";
import {
  useCompoundTypes,
  useCompoundProperties,
} from "../../../../../queries/compounds";
import CompoundTypeManager from "./CompoundTypeManager";
import { useEntityColumns } from "@grit/core";

const CompoundTypeManagerPage = () => {
  const {
    data: types,
    isLoading: isTypesLoading,
    isError: isTypesError,
    error: typesError,
  } = useCompoundTypes();
  const {
    data: typeColumns,
    isLoading: isTypeColumnsLoading,
    isError: isTypeColumnsError,
    error: typeColumnsError,
  } = useEntityColumns("Grit::Compounds::CompoundType");
  const {
    data: compoundProperties,
    isLoading: isCompoundPropertiesLoading,
    isError: isCompoundPropertiesError,
    error: compoundPropertiesError,
  } = useCompoundProperties();
  const {
    data: compoundPropertyColumns,
    isLoading: isCompoundPropertyColumnsLoading,
    isError: isCompoundPropertyColumnsError,
    error: compoundPropertyColumnsError,
  } = useEntityColumns("Grit::Compounds::CompoundProperty");
  const {
    data: batchProperties,
    isLoading: isBatchPropertiesLoading,
    isError: isBatchPropertiesError,
    error: batchPropertiesError,
  } = useBatchProperties();
  const {
    data: batchPropertyColumns,
    isLoading: isBatchPropertyColumnsLoading,
    isError: isBatchPropertyColumnsError,
    error: batchPropertyColumnsError,
  } = useEntityColumns("Grit::Compounds::BatchProperty");

  if (
    isTypesLoading ||
    isTypeColumnsLoading ||
    isCompoundPropertiesLoading ||
    isCompoundPropertyColumnsLoading ||
    isBatchPropertiesLoading ||
    isBatchPropertyColumnsLoading
  )
    return <Spinner />;

  if (
    !types ||
    isTypesError ||
    !typeColumns ||
    isTypeColumnsError ||
    !compoundProperties ||
    isCompoundPropertiesError ||
    !compoundPropertyColumns ||
    isCompoundPropertyColumnsError ||
    !batchProperties ||
    isBatchPropertiesError ||
    !batchPropertyColumns ||
    isBatchPropertyColumnsError
  ) {
    return (
      <ErrorPage
        error={
          typesError ??
          typeColumnsError ??
          compoundPropertiesError ??
          compoundPropertyColumnsError ??
          batchPropertiesError ??
          batchPropertyColumnsError}
      />
    );
  }

  return <CompoundTypeManager />;
};

export default CompoundTypeManagerPage;
